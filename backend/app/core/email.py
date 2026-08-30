import asyncio
import smtplib
from abc import ABC, abstractmethod
from email.mime.text import MIMEText

from app.core.config import settings


class EmailProvider(ABC):
    @abstractmethod
    async def send(self, to_address: str, code: str) -> None: ...


class ConsoleEmailProvider(EmailProvider):
    """Dev-only. This — and ConsoleSmsProvider — are the ONLY places a raw
    OTP code is ever written to any output. See CLAUDE.md §6."""

    async def send(self, to_address: str, code: str) -> None:
        print(f"[email:console] OTP for {to_address}: {code}")


def _send_sync(msg: MIMEText, to_address: str) -> None:
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_ADDRESS, [to_address], msg.as_string())


class SmtpEmailProvider(EmailProvider):
    """Real implementation via stdlib smtplib/email.mime — no new dependency.
    smtplib is blocking, so it runs off the event loop via asyncio.to_thread
    so an async route never blocks on network I/O."""

    async def send(self, to_address: str, code: str) -> None:
        minutes = settings.OTP_TTL_SECONDS // 60
        msg = MIMEText(f"کد ورود شما: {code}\nاین کد تا {minutes} دقیقه معتبر است.")
        msg["Subject"] = "کد ورود — تجهیزات پزشکی کارآمد"
        msg["From"] = settings.SMTP_FROM_ADDRESS
        msg["To"] = to_address
        await asyncio.to_thread(_send_sync, msg, to_address)


def get_email_provider() -> EmailProvider:
    if settings.EMAIL_PROVIDER == "console":
        return ConsoleEmailProvider()
    if settings.EMAIL_PROVIDER == "smtp":
        return SmtpEmailProvider()
    raise ValueError(f"Unknown EMAIL_PROVIDER: {settings.EMAIL_PROVIDER}")
