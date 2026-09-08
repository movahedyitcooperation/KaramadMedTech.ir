"""Tests for review submission, moderation, and the rating recompute they
drive.

Integration only, against a real PostgreSQL with the seeded catalog —
mirroring test_search.py's own skip-if-unreachable pattern. Every test that
mutates state (a submitted review, an admin status change, the seeded
product's own rating_avg/rating_count) restores exactly what it changed in a
fixture teardown, since this suite runs against the same database
`devdb.sh`/production use — not a disposable per-test transaction.

Rate limiting isn't covered here, for the same reason it isn't covered for
OTP's identical per-IP pattern in test_search.py: it depends on the request's
client IP, which httpx's ASGITransport doesn't simulate realistically enough
to test meaningfully at this layer.
"""

import asyncio
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select

SEEDED_PRODUCT_SLUG = "tabsanj-gheyre-tamasi-microlife"


def _database_reachable() -> bool:
    """Skip rather than fail when there is no database — same probe as
    test_search.py's own (duplicated rather than imported, so this file
    stays independently readable and the two suites can't accidentally
    couple through a shared private helper)."""
    from sqlalchemy import text as sql_text

    from app.core.database import engine

    async def probe() -> bool:
        try:
            async with engine.connect() as conn:
                await conn.execute(sql_text("SELECT 1"))
            return True
        except Exception:
            return False
        finally:
            await engine.dispose()

    try:
        return asyncio.run(probe())
    except Exception:
        return False


pytestmark_db = pytest.mark.skipif(
    not _database_reachable(),
    reason="no reachable database — see backend/README.md's devdb.sh section",
)


@pytest_asyncio.fixture
async def client():
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def db():
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def seeded_product(db):
    """The product under test, plus a guarantee that whatever this test does
    to its rating_avg/rating_count/reviews is undone afterward."""
    from app.models.product import Product

    product = (
        await db.execute(select(Product).where(Product.slug == SEEDED_PRODUCT_SLUG))
    ).scalar_one()
    original_avg, original_count = product.rating_avg, product.rating_count
    product_id = product.id

    yield product

    from app.models.review import Review

    await db.execute(delete(Review).where(Review.product_id == product_id))
    reloaded = await db.get(Product, product_id)
    reloaded.rating_avg = original_avg
    reloaded.rating_count = original_count
    await db.commit()


@pytest_asyncio.fixture
async def admin_token(db):
    """A throwaway AdminUser — get_current_admin (app/api/v1/auth.py) looks
    the row up by id on every request, so a bare JWT with no matching row
    401s; this fixture exists to satisfy that, not to test admin auth
    itself."""
    from app.core.security import create_access_token, hash_password
    from app.models.admin_user import AdminUser

    admin = AdminUser(
        email=f"test-review-admin-{uuid.uuid4().hex[:8]}@example.com",
        password_hash=hash_password("Test1234!"),
        role="ADMIN",
        is_active=True,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)

    token, _ = create_access_token(subject=admin.id, role="ADMIN")

    yield token

    await db.delete(admin)
    await db.commit()


@pytestmark_db
@pytest.mark.asyncio
class TestSubmitReview:
    async def test_submission_is_pending_and_not_publicly_visible(self, client, seeded_product):
        res = await client.post(
            "/api/v1/reviews/",
            json={
                "product_id": str(seeded_product.id),
                "reviewer_name": "زهرا رضایی",
                "reviewer_phone": "09123456789",
                "rating": 5,
                "body": "کیفیت خوبی داشت.",
            },
        )
        assert res.status_code == 201, res.text
        body = res.json()
        assert body["status"] == "pending"

        listing = await client.get("/api/v1/reviews/", params={"product_id": str(seeded_product.id)})
        assert listing.status_code == 200
        assert listing.json()["total"] == 0  # pending, so absent from the public list

    async def test_rejects_out_of_range_rating(self, client, seeded_product):
        for bad_rating in (0, 6, -1):
            res = await client.post(
                "/api/v1/reviews/",
                json={
                    "product_id": str(seeded_product.id),
                    "reviewer_name": "تست",
                    "rating": bad_rating,
                    "body": "متن نظر",
                },
            )
            assert res.status_code == 422, res.text
            assert res.json()["detail"]["code"] == "invalid_rating"

    async def test_rejects_empty_name_and_body(self, client, seeded_product):
        res = await client.post(
            "/api/v1/reviews/",
            json={"product_id": str(seeded_product.id), "reviewer_name": "  ", "rating": 4, "body": "متن نظر"},
        )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "invalid_reviewer_name"

        res = await client.post(
            "/api/v1/reviews/",
            json={"product_id": str(seeded_product.id), "reviewer_name": "تست", "rating": 4, "body": "  "},
        )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "invalid_review_body"

    async def test_rejects_invalid_phone(self, client, seeded_product):
        res = await client.post(
            "/api/v1/reviews/",
            json={
                "product_id": str(seeded_product.id),
                "reviewer_name": "تست",
                "reviewer_phone": "12345",
                "rating": 4,
                "body": "متن نظر",
            },
        )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "invalid_reviewer_phone"

    async def test_rejects_unknown_product(self, client):
        res = await client.post(
            "/api/v1/reviews/",
            json={"product_id": str(uuid.uuid4()), "reviewer_name": "تست", "rating": 4, "body": "متن نظر"},
        )
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "product_not_found"


@pytestmark_db
@pytest.mark.asyncio
class TestModeration:
    async def test_requires_admin_auth(self, client):
        res = await client.get("/api/v1/admin/reviews/")
        assert res.status_code == 401

    async def test_approve_makes_review_public_and_recomputes_rating(
        self, client, seeded_product, admin_token
    ):
        headers = {"Authorization": f"Bearer {admin_token}"}

        submit = await client.post(
            "/api/v1/reviews/",
            json={
                "product_id": str(seeded_product.id),
                "reviewer_name": "علی محمدی",
                "rating": 4,
                "body": "راضی بودم.",
            },
        )
        review_id = submit.json()["id"]

        pending_list = await client.get(
            "/api/v1/admin/reviews/", params={"status": "pending"}, headers=headers
        )
        assert pending_list.status_code == 200
        assert any(r["id"] == review_id for r in pending_list.json()["items"])

        approve = await client.patch(
            f"/api/v1/admin/reviews/{review_id}", json={"status": "approved"}, headers=headers
        )
        assert approve.status_code == 200, approve.text
        assert approve.json()["status"] == "approved"

        public_list = await client.get(
            "/api/v1/reviews/", params={"product_id": str(seeded_product.id)}
        )
        assert public_list.status_code == 200
        public_items = public_list.json()["items"]
        assert len(public_items) == 1
        assert public_items[0]["reviewer_name"] == "علی محمدی"
        assert "reviewer_phone" not in public_items[0]  # never publicly exposed
        assert "status" not in public_items[0]  # every row here is 'approved' by construction

        products_res = await client.get(f"/api/v1/products/{SEEDED_PRODUCT_SLUG}")
        product_data = products_res.json()
        assert product_data["rating_avg"] == 4.0
        assert product_data["rating_count"] == 1

    async def test_reject_keeps_review_hidden_and_out_of_the_rating(
        self, client, seeded_product, admin_token
    ):
        headers = {"Authorization": f"Bearer {admin_token}"}

        submit = await client.post(
            "/api/v1/reviews/",
            json={
                "product_id": str(seeded_product.id),
                "reviewer_name": "سارا احمدی",
                "rating": 1,
                "body": "مناسب من نبود.",
            },
        )
        review_id = submit.json()["id"]

        reject = await client.patch(
            f"/api/v1/admin/reviews/{review_id}", json={"status": "rejected"}, headers=headers
        )
        assert reject.status_code == 200
        assert reject.json()["status"] == "rejected"

        public_list = await client.get(
            "/api/v1/reviews/", params={"product_id": str(seeded_product.id)}
        )
        assert public_list.json()["total"] == 0

        products_res = await client.get(f"/api/v1/products/{SEEDED_PRODUCT_SLUG}")
        assert products_res.json()["rating_count"] == 0

    async def test_invalid_status_value_is_rejected(self, client, seeded_product, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        submit = await client.post(
            "/api/v1/reviews/",
            json={"product_id": str(seeded_product.id), "reviewer_name": "تست", "rating": 3, "body": "متن"},
        )
        review_id = submit.json()["id"]

        res = await client.patch(
            f"/api/v1/admin/reviews/{review_id}", json={"status": "not_a_real_status"}, headers=headers
        )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "invalid_review_status"
