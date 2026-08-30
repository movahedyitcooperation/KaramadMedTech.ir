from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: UUID, role: str, expires_minutes: int | None = None) -> tuple[str, int]:
    """Returns (token, expires_in_seconds). `expires_minutes` overrides the
    global (admin-oriented) JWT_EXPIRE_MINUTES — customer logins pass
    settings.CUSTOMER_JWT_EXPIRE_DAYS * 24 * 60 here; the admin call site
    passes nothing and is unaffected."""
    minutes = expires_minutes if expires_minutes is not None else settings.JWT_EXPIRE_MINUTES
    expires_delta = timedelta(minutes=minutes)
    expire = datetime.now(timezone.utc) + expires_delta
    claims = {"sub": str(subject), "role": role, "exp": expire}
    token = jwt.encode(claims, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, int(expires_delta.total_seconds())


def decode_access_token(token: str) -> dict:
    """Raises jose.JWTError on invalid/expired token — callers translate to 401."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


# --- OTP hashing — reuses the same argon2 pwd_context as passwords, not a
# second hashing convention (e.g. hashlib). No new dependency.


def hash_otp_code(code: str) -> str:
    return pwd_context.hash(code)


def verify_otp_code(code: str, code_hash: str) -> bool:
    return pwd_context.verify(code, code_hash)
