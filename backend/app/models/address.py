import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

# UUID PK — deliberately NOT the plain-int-PK pattern ProductImage/
# ProductSpec use. Unlike those, Address rows are likely to become an FK
# target from a *different* table in Phase 6 (Order.address_id) — a UUID PK
# now avoids a PK-type migration later.


class Address(Base, TimestampMixin):
    __tablename__ = "addresses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "خانه", "مطب"
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)  # recipient, may differ from the account holder
    phone: Mapped[str] = mapped_column(String(20), nullable=False)  # always a callable phone, regardless of login channel
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    address_line: Mapped[str] = mapped_column(String(500), nullable=False)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # "only one default per user" is enforced app-side in the route (unset
    # siblings in the same transaction) — no partial-unique-index precedent
    # elsewhere in this codebase, so this stays consistent with that.
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="addresses")
