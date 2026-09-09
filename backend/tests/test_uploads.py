"""Tests for the admin image-upload pipeline: content-type/size gating and
the Pillow resize/re-encode step.

Integration only, against a real PostgreSQL — get_current_admin looks the
admin row up by id on every request, so exercising auth needs a real
AdminUser row, not just a signed JWT. Mirrors test_search.py's own
skip-if-unreachable pattern; a few small fixtures are duplicated from
test_reviews.py rather than imported, so each test file stays independently
readable (see that file's own comment on the same choice).

No real filesystem writes are asserted against directly — every uploaded
file this suite creates is deleted in its own fixture teardown, since
UPLOAD_DIR is the same directory a running dev/staging server actually
serves from.
"""

import asyncio
import io
import uuid
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import Image


def _database_reachable() -> bool:
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
async def admin_token(db):
    from app.core.security import create_access_token, hash_password
    from app.models.admin_user import AdminUser

    admin = AdminUser(
        email=f"test-upload-admin-{uuid.uuid4().hex[:8]}@example.com",
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


@pytest_asyncio.fixture
async def uploaded_files():
    """Tracks every filename the test's upload responses hand back, and
    deletes them from the real UPLOAD_DIR afterward — see the module
    docstring for why this matters here specifically."""
    from app.core.config import settings

    created: list[str] = []
    yield created
    upload_dir = Path(settings.UPLOAD_DIR)
    for name in created:
        (upload_dir / name).unlink(missing_ok=True)


def _png_bytes(size: tuple[int, int], mode: str = "RGB", color=(200, 30, 30)) -> bytes:
    image = Image.new(mode, size, color)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _filename_from_url(url: str) -> str:
    return url.rsplit("/", 1)[-1]


@pytestmark_db
@pytest.mark.asyncio
class TestUploadImage:
    async def test_requires_admin_auth(self, client):
        res = await client.post(
            "/api/v1/admin/uploads/images",
            files={"file": ("photo.png", _png_bytes((100, 100)), "image/png")},
        )
        assert res.status_code == 401

    async def test_oversized_dimensions_are_capped_and_converted_to_webp(
        self, client, admin_token, uploaded_files
    ):
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = await client.post(
            "/api/v1/admin/uploads/images",
            files={"file": ("big.png", _png_bytes((3200, 2400)), "image/png")},
            headers=headers,
        )
        assert res.status_code == 200, res.text
        url = res.json()["url"]
        assert url.endswith(".webp")
        filename = _filename_from_url(url)
        uploaded_files.append(filename)

        served = await client.get(url)
        assert served.status_code == 200
        image = Image.open(io.BytesIO(served.content))
        assert image.format == "WEBP"
        assert max(image.size) == 1600
        assert image.size == (1600, 1200)  # aspect ratio preserved

    async def test_small_image_is_still_converted_but_not_upscaled(
        self, client, admin_token, uploaded_files
    ):
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = await client.post(
            "/api/v1/admin/uploads/images",
            files={"file": ("small.png", _png_bytes((200, 150)), "image/png")},
            headers=headers,
        )
        assert res.status_code == 200
        filename = _filename_from_url(res.json()["url"])
        uploaded_files.append(filename)

        served = await client.get(res.json()["url"])
        image = Image.open(io.BytesIO(served.content))
        assert image.format == "WEBP"
        assert image.size == (200, 150)  # untouched — already under the cap

    async def test_transparency_is_preserved(self, client, admin_token, uploaded_files):
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = await client.post(
            "/api/v1/admin/uploads/images",
            files={
                "file": ("transparent.png", _png_bytes((200, 150), mode="RGBA", color=(0, 0, 0, 0)), "image/png")
            },
            headers=headers,
        )
        assert res.status_code == 200
        filename = _filename_from_url(res.json()["url"])
        uploaded_files.append(filename)

        served = await client.get(res.json()["url"])
        image = Image.open(io.BytesIO(served.content))
        assert image.mode == "RGBA"

    async def test_response_is_cached_long_lived(self, client, admin_token, uploaded_files):
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = await client.post(
            "/api/v1/admin/uploads/images",
            files={"file": ("photo.png", _png_bytes((300, 200)), "image/png")},
            headers=headers,
        )
        filename = _filename_from_url(res.json()["url"])
        uploaded_files.append(filename)

        served = await client.get(res.json()["url"])
        assert served.headers["cache-control"] == "public, max-age=31536000, immutable"

    async def test_rejects_disallowed_content_type(self, client, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = await client.post(
            "/api/v1/admin/uploads/images",
            files={"file": ("notes.txt", b"hello", "text/plain")},
            headers=headers,
        )
        assert res.status_code == 415

    async def test_rejects_corrupt_or_mislabeled_file(self, client, admin_token):
        """A real security check, not just an optimization: a file whose
        Content-Type header claims 'image/png' but whose bytes aren't a
        decodable image must not be trusted just because the header says
        so — the header is caller-supplied and unverified."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = await client.post(
            "/api/v1/admin/uploads/images",
            files={"file": ("fake.png", b"this is not an image", "image/png")},
            headers=headers,
        )
        assert res.status_code == 415

    async def test_rejects_oversized_upload(self, client, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        oversized = b"\x00" * (5 * 1024 * 1024 + 1)
        res = await client.post(
            "/api/v1/admin/uploads/images",
            files={"file": ("huge.png", oversized, "image/png")},
            headers=headers,
        )
        assert res.status_code == 413
