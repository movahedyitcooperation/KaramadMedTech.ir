import uuid

from sqlalchemy import Boolean, CheckConstraint, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

# Separate table from AdminUser by design (see admin_user.py's own comment —
# that decision predates this phase and isn't revisited here).
#
# phone/email are both nullable, but never both null: whichever channel a
# customer first verifies an OTP through becomes their identity for this
# account row. A customer who later verifies the *other* channel gets a
# second, separate User row — no identity unification across channels is in
# scope for Phase 5. Postgres treats multiple NULLs as distinct under a
# plain `unique=True` column, so no partial index is needed for this.


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        CheckConstraint("phone IS NOT NULL OR email IS NOT NULL", name="ck_users_phone_or_email"),
    )

    addresses: Mapped[list["Address"]] = relationship(
        "Address", back_populates="user", cascade="all, delete-orphan"
    )
    cart: Mapped["CartSession | None"] = relationship("CartSession", back_populates="user", uselist=False)
