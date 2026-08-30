import uuid

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class CartSession(Base, TimestampMixin):
    __tablename__ = "cart_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Exactly one of user_id/guest_token is ever set — an account cart (row
    # keyed by user_id, guest_token NULL) or a guest cart (guest_token set,
    # user_id NULL). On login the guest row either gets promoted in place
    # (user_id set, guest_token cleared, when the user had no prior cart) or
    # is merged into an existing account cart and discarded — see
    # _merge_guest_cart_into_user in app/api/v1/customer_auth.py.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=True
    )
    guest_token: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)

    user: Mapped["User | None"] = relationship("User", back_populates="cart")
    items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "(user_id IS NOT NULL AND guest_token IS NULL) OR (user_id IS NULL AND guest_token IS NOT NULL)",
            name="ck_cart_sessions_owner_xor",
        ),
    )
