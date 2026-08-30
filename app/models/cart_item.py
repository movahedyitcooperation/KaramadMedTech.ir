import uuid

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

# Plain int PK — same reasoning as ProductImage/ProductSpec: only ever read
# nested under a CartSession, never addressed independently.
#
# No price snapshot: a cart line always displays the product's *current*
# price/stock (joined live in the read query), not a price captured at
# add-to-cart time. CLAUDE.md §5's "never trust the cart, always re-check
# server-side" already implies the cart isn't a source of truth for price
# pre-checkout, so storing one here would just be a second value to keep in
# sync for no benefit in this phase. Phase 6's OrderItem is expected to
# snapshot price directly at order-creation time instead.


class CartItem(Base, TimestampMixin):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cart_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # CASCADE (not RESTRICT like Product.category_id, not SET NULL): a cart
    # item for a since-deleted product is meaningless and product_id is
    # non-nullable, so silently dropping the line on product deletion is the
    # only sane option — an admin deleting a product must never be blocked
    # by someone's stale cart.
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    qty: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    cart: Mapped["CartSession"] = relationship("CartSession", back_populates="items")
    product: Mapped["Product"] = relationship("Product")

    __table_args__ = (UniqueConstraint("cart_id", "product_id", name="uq_cart_items_cart_product"),)
