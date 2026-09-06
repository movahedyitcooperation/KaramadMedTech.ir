import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

# Address fields are snapshotted here at checkout time, not read live via
# address_id — CLAUDE.md's "never trust the cart, re-check server-side"
# principle extends to addresses too: an order must stay accurate even if
# the customer later edits or deletes the address it shipped to.
# address_id is kept only for reference/display convenience (SET NULL if
# the address is later deleted — the snapshot fields remain the source of
# truth regardless).


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Human-facing invoice number, generated from the order_number_seq
    # Postgres sequence (see the migration) — nextval() advances even if
    # the enclosing transaction rolls back, which is exactly what we want:
    # small gaps in numbering from an abandoned checkout are fine, two
    # different orders sharing a number is not.
    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    # RESTRICT: no admin delete-user flow exists yet, but a customer with
    # order history should never be silently deletable — same reasoning as
    # Product.category_id's RESTRICT.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    address_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True
    )

    address_title: Mapped[str] = mapped_column(String(100), nullable=False)
    address_full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    address_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    address_province: Mapped[str] = mapped_column(String(100), nullable=False)
    address_city: Mapped[str] = mapped_column(String(100), nullable=False)
    address_line: Mapped[str] = mapped_column(String(500), nullable=False)
    address_postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    subtotal: Mapped[int] = mapped_column(Integer, nullable=False)
    shipping_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    # pending_payment | paid | processing | shipped | delivered | cancelled
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending_payment")

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan", order_by="OrderItem.id"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="order", cascade="all, delete-orphan", order_by="Payment.created_at"
    )
