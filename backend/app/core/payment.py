import asyncio
import json
import secrets
import urllib.request
from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.core.config import settings


class PaymentProviderError(Exception):
    """Raised on any payment-provider failure (network error, rejected
    request, etc.) — routes catch this and translate to a structured
    {"code": "payment_request_failed"} response, matching the pattern
    already used for OTP delivery failures. Never lets a raw provider
    error/traceback reach the frontend."""


@dataclass
class PaymentRequestResult:
    authority: str
    payment_url: str


@dataclass
class PaymentVerifyResult:
    verified: bool
    ref_id: str | None = None
    error: str | None = None


class PaymentProvider(ABC):
    @abstractmethod
    async def request_payment(self, amount: int, order_number: str, description: str) -> PaymentRequestResult: ...

    @abstractmethod
    async def verify_payment(self, authority: str, amount: int) -> PaymentVerifyResult: ...


class MockPaymentProvider(PaymentProvider):
    """Dev-only — auto-approves every payment, matching SMS/Email's console
    mode (see core/sms.py, core/email.py). `authority` is a fabricated but
    unique-enough string; verification always succeeds.

    A random suffix is required, not cosmetic: `payments.authority` is
    `unique=True`, and a deterministic `MOCK-{order_number}` collides on a
    second `POST /payments/request` for the same order — e.g. retrying after
    a cancelled attempt — raising an IntegrityError the endpoint has no
    handler for. Real ZarinPal doesn't have this problem since it mints a
    fresh authority per request; the mock provider now matches that."""

    async def request_payment(self, amount: int, order_number: str, description: str) -> PaymentRequestResult:
        authority = f"MOCK-{order_number}-{secrets.token_hex(4)}"
        return PaymentRequestResult(
            authority=authority,
            payment_url=f"{settings.FRONTEND_ORIGIN}/checkout/mock-pay?authority={authority}",
        )

    async def verify_payment(self, authority: str, amount: int) -> PaymentVerifyResult:
        return PaymentVerifyResult(verified=True, ref_id=f"MOCKREF-{authority}")


def _zarinpal_api_base() -> str:
    return "https://sandbox.zarinpal.com" if settings.ZARINPAL_SANDBOX else "https://api.zarinpal.com"


def _zarinpal_startpay_base() -> str:
    return "https://sandbox.zarinpal.com/pg/StartPay" if settings.ZARINPAL_SANDBOX else "https://www.zarinpal.com/pg/StartPay"


def _post_json(url: str, payload: dict) -> dict:
    """Blocking stdlib POST — no new HTTP-client dependency (matches this
    project's SMS/email convention of stdlib-only network calls). Run via
    asyncio.to_thread so an async route never blocks on network I/O."""
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json", "Accept": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


class ZarinpalPaymentProvider(PaymentProvider):
    """Real implementation via ZarinPal's REST API (v4). Amounts are in
    Toman throughout — matches both CLAUDE.md's "numbers stored in Toman,
    not Rial" rule and the v4 API itself (older ZarinPal API versions
    expected Rial; v4 does not)."""

    async def request_payment(self, amount: int, order_number: str, description: str) -> PaymentRequestResult:
        try:
            body = await asyncio.to_thread(
                _post_json,
                f"{_zarinpal_api_base()}/pg/v4/payment/request.json",
                {
                    "merchant_id": settings.ZARINPAL_MERCHANT_ID,
                    "amount": amount,
                    "callback_url": settings.ZARINPAL_CALLBACK_URL,
                    "description": description,
                    "metadata": {"order_number": order_number},
                },
            )
        except Exception as exc:  # network error, timeout, non-2xx, etc.
            raise PaymentProviderError(f"ZarinPal request_payment failed: {exc}") from exc

        data = body.get("data") or {}
        if data.get("code") != 100:
            raise PaymentProviderError(f"ZarinPal rejected the payment request: {body.get('errors')}")
        authority = data["authority"]
        return PaymentRequestResult(authority=authority, payment_url=f"{_zarinpal_startpay_base()}/{authority}")

    async def verify_payment(self, authority: str, amount: int) -> PaymentVerifyResult:
        try:
            body = await asyncio.to_thread(
                _post_json,
                f"{_zarinpal_api_base()}/pg/v4/payment/verify.json",
                {"merchant_id": settings.ZARINPAL_MERCHANT_ID, "amount": amount, "authority": authority},
            )
        except Exception as exc:
            return PaymentVerifyResult(verified=False, error=f"ZarinPal verify_payment failed: {exc}")

        data = body.get("data") or {}
        # code 100 = newly verified; 101 = already verified (ZarinPal's own
        # idempotency signal for a repeated verify call) — both count as
        # success. Our own Payment.status check is a second, independent
        # idempotency guard on top of this (see app/api/v1/payments.py).
        if data.get("code") in (100, 101):
            return PaymentVerifyResult(verified=True, ref_id=str(data.get("ref_id")))
        return PaymentVerifyResult(verified=False, error=str(body.get("errors")))


def get_payment_provider() -> PaymentProvider:
    if settings.PAYMENT_PROVIDER == "mock":
        return MockPaymentProvider()
    if settings.PAYMENT_PROVIDER == "zarinpal":
        return ZarinpalPaymentProvider()
    raise ValueError(f"Unknown PAYMENT_PROVIDER: {settings.PAYMENT_PROVIDER}")
