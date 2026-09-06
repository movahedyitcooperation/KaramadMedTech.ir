"""Account and address behaviour, against a real database.

The default-address rules are the part worth pinning down: they are easy to get
subtly wrong (the create path did, before these tests existed — a
`_clear_other_defaults` call placed after `db.add()` autoflushed the new row and
then cleared the very flag it was meant to set), and nothing in the UI surfaces
the mistake until checkout needs a default and finds none.
"""

import asyncio
import uuid
from collections.abc import Iterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


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
async def client() -> Iterator[AsyncClient]:
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
def captured_otps(monkeypatch) -> dict[str, str]:
    """Captures OTP codes in-process instead of scraping stdout.

    Patches the name **as customer_auth imported it** — that module does
    `from app.core.sms import get_sms_provider`, which binds the function
    object, so patching `app.core.sms` would have no effect on it.
    """
    import app.api.v1.customer_auth as customer_auth

    codes: dict[str, str] = {}

    class CapturingProvider:
        async def send(self, contact: str, code: str) -> None:
            codes[contact] = code

    monkeypatch.setattr(customer_auth, "get_sms_provider", lambda: CapturingProvider())
    return codes


async def login(client: AsyncClient, captured: dict[str, str]) -> dict[str, str]:
    """Registers and logs in a throwaway customer; returns auth headers."""
    contact = f"09{uuid.uuid4().int % 10**9:09d}"
    res = await client.post("/api/v1/auth/customer/request-otp", json={"contact": contact})
    assert res.status_code == 200, res.text
    assert contact in captured, "the SMS provider was never called"
    res = await client.post(
        "/api/v1/auth/customer/verify-otp",
        json={"contact": contact, "code": captured[contact]},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


ADDRESS = {
    "title": "مطب",
    "full_name": "مریم رستگار",
    "phone": "09121234567",
    "province": "تهران",
    "city": "تهران",
    "address_line": "ولیعصر، پلاک ۲۴۱۰",
    "postal_code": "1969734512",
}


@pytestmark_db
@pytest.mark.asyncio
class TestDefaultAddress:
    async def test_first_address_becomes_default_even_unticked(self, client, captured_otps):
        auth = await login(client, captured_otps)
        res = await client.post(
            "/api/v1/account/addresses", json={**ADDRESS, "is_default": False}, headers=auth
        )
        assert res.status_code == 201, res.text
        # An account with addresses but no default is unusable at checkout.
        assert res.json()["is_default"] is True

    async def test_is_default_true_on_create_is_honoured(self, client, captured_otps):
        auth = await login(client, captured_otps)
        await client.post("/api/v1/account/addresses", json=ADDRESS, headers=auth)
        res = await client.post(
            "/api/v1/account/addresses",
            json={**ADDRESS, "title": "خانه", "is_default": True},
            headers=auth,
        )
        assert res.status_code == 201, res.text
        # The regression: the create path used to clear this flag on the very
        # row it had just inserted, so it always came back False.
        assert res.json()["is_default"] is True

    async def test_exactly_one_default_after_several_creates(self, client, captured_otps):
        auth = await login(client, captured_otps)
        for i in range(3):
            res = await client.post(
                "/api/v1/account/addresses",
                json={**ADDRESS, "title": f"آدرس {i}", "is_default": True},
                headers=auth,
            )
            assert res.status_code == 201, res.text

        addrs = (await client.get("/api/v1/account/addresses", headers=auth)).json()
        assert len(addrs) == 3
        assert sum(1 for a in addrs if a["is_default"]) == 1

    async def test_patch_moves_the_default(self, client, captured_otps):
        auth = await login(client, captured_otps)
        first = (await client.post("/api/v1/account/addresses", json=ADDRESS, headers=auth)).json()
        second = (
            await client.post(
                "/api/v1/account/addresses", json={**ADDRESS, "title": "خانه"}, headers=auth
            )
        ).json()
        assert first["is_default"] is True and second["is_default"] is False

        res = await client.patch(
            f"/api/v1/account/addresses/{second['id']}", json={"is_default": True}, headers=auth
        )
        assert res.status_code == 200 and res.json()["is_default"] is True

        by_id = {a["id"]: a for a in (await client.get("/api/v1/account/addresses", headers=auth)).json()}
        assert by_id[second["id"]]["is_default"] is True
        assert by_id[first["id"]]["is_default"] is False


@pytestmark_db
@pytest.mark.asyncio
class TestAccountSecurity:
    async def test_addresses_are_scoped_to_their_owner(self, client, captured_otps):
        mine_auth = await login(client, captured_otps)
        mine = (
            await client.post("/api/v1/account/addresses", json=ADDRESS, headers=mine_auth)
        ).json()

        other_auth = await login(client, captured_otps)

        # Guessing a UUID must not be a way in — and 404 rather than 403, so the
        # response does not confirm the address exists either.
        assert (
            await client.get(f"/api/v1/account/addresses/{mine['id']}", headers=other_auth)
        ).status_code == 404
        assert (
            await client.patch(
                f"/api/v1/account/addresses/{mine['id']}", json={"city": "x"}, headers=other_auth
            )
        ).status_code == 404
        assert (
            await client.delete(f"/api/v1/account/addresses/{mine['id']}", headers=other_auth)
        ).status_code == 404
        assert (await client.get("/api/v1/account/addresses", headers=other_auth)).json() == []

    async def test_account_requires_a_token(self, client):
        assert (await client.get("/api/v1/account/me")).status_code in (401, 403)
        assert (
            await client.get("/api/v1/account/me", headers={"Authorization": "Bearer nonsense"})
        ).status_code == 401

    async def test_login_identity_is_not_editable(self, client, captured_otps):
        auth = await login(client, captured_otps)
        before = (await client.get("/api/v1/account/me", headers=auth)).json()
        after = (
            await client.patch(
                "/api/v1/account/me",
                json={"full_name": "نام تازه", "phone": "09999999999", "email": "x@y.z"},
                headers=auth,
            )
        ).json()
        assert after["full_name"] == "نام تازه"
        assert after["phone"] == before["phone"]
        assert after["email"] == before["email"]


@pytestmark_db
@pytest.mark.asyncio
class TestGuestCartMerge:
    async def test_guest_cart_merges_into_the_account_on_login(self, client, captured_otps):
        products = (await client.get("/api/v1/products/", params={"page_size": 1})).json()
        pid = products["items"][0]["id"]

        guest = f"test-guest-{uuid.uuid4()}"
        gh = {"X-Guest-Cart-Token": guest}
        add = await client.post(
            "/api/v1/cart/items", json={"product_id": pid, "qty": 2}, headers=gh
        )
        assert add.status_code == 200 and add.json()["items"][0]["qty"] == 2

        contact = f"09{uuid.uuid4().int % 10**9:09d}"
        await client.post("/api/v1/auth/customer/request-otp", json={"contact": contact})
        verify = await client.post(
            "/api/v1/auth/customer/verify-otp",
            json={"contact": contact, "code": captured_otps[contact], "guest_cart_token": guest},
        )
        assert verify.status_code == 200, verify.text

        merged = verify.json()["cart"]
        assert [i["product_id"] for i in merged["items"]] == [pid]
        assert merged["items"][0]["qty"] == 2

        # The guest token must not still reach the account's cart afterwards,
        # or a shared device would hand the next visitor someone else's basket.
        after = await client.get("/api/v1/cart/", headers=gh)
        assert after.json()["items"] == []
