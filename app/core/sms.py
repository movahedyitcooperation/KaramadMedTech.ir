from abc import ABC, abstractmethod

from app.core.config import settings


class SmsProvider(ABC):
    @abstractmethod
    async def send(self, phone: str, code: str) -> None: ...


class ConsoleSmsProvider(SmsProvider):
    """Dev-only. This — and ConsoleEmailProvider — are the ONLY places a raw
    OTP code is ever written to any output. See CLAUDE.md §6."""

    async def send(self, phone: str, code: str) -> None:
        print(f"[sms:console] OTP for {phone}: {code}")


class KavenegarSmsProvider(SmsProvider):
    """Structural stub only — not wired to a live account (no credentials
    exist yet). When real credentials arrive, implement via stdlib
    urllib.request (no new HTTP-client dependency needed)."""

    async def send(self, phone: str, code: str) -> None:
        raise NotImplementedError("Kavenegar SMS not yet wired — set SMS_PROVIDER=console for now")


class SmsIrSmsProvider(SmsProvider):
    """Structural stub — see KavenegarSmsProvider's note."""

    async def send(self, phone: str, code: str) -> None:
        raise NotImplementedError("SMS.ir not yet wired — set SMS_PROVIDER=console for now")


def get_sms_provider() -> SmsProvider:
    if settings.SMS_PROVIDER == "console":
        return ConsoleSmsProvider()
    if settings.SMS_PROVIDER == "kavenegar":
        return KavenegarSmsProvider()
    if settings.SMS_PROVIDER == "smsir":
        return SmsIrSmsProvider()
    raise ValueError(f"Unknown SMS_PROVIDER: {settings.SMS_PROVIDER}")
