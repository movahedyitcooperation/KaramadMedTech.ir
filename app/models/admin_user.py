import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

# Deliberately NOT the future customer `User` model (app/models/user.py,
# reserved by its own comment for Phase 5's SMS-OTP auth). Admin accounts are
# password+email, CLI-bootstrapped, and few in number — nothing in common
# with phone/OTP customer auth. A separate table avoids forcing nullable
# password_hash/email columns onto that future customer table.


class AdminUser(Base, TimestampMixin):
    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="ADMIN")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
