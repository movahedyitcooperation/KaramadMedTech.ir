import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

# Plain int PK — same reasoning as ProductImage/CartItem: never addressed
# independently, only ever read nested under an Order.
#
# Full snapshot of product name/sku/price at order time — the deliberate
# DIFFERENCE from CartItem, which has no snapshot and joins price live.
# Once an order exists, its contents must never change even if the
# product's price changes or the product is later deleted or renamed.


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # SET NULL, not CASCADE/RESTRICT: an order line must survive the
    # product being deleted later — product_id becomes historical-only,
    # the snapshot fields below are what actually render on the invoice.
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    product_sku: Mapped[str] = mapped_column(String(64), nullable=False)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
