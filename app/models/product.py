import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

# `description` is stored as JSONB holding a list[str], not as a single Text
# column. The frontend's Product.description TS type is `string[]` (an array
# of paragraph strings — see lib/types/product.ts and lib/mock/products.ts in
# the Next.js repo). JSONB round-trips that exact shape losslessly with zero
# serialization convention; a Text column would need a lossy join/split
# convention (e.g. "\n\n".join / .split) with no reliable inverse if any
# paragraph itself contained a blank line.


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    short_desc: Mapped[str | None] = mapped_column(String(300), nullable=True)
    description: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    compare_at_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sku: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # ON DELETE RESTRICT is deliberate: a category with live products should
    # not be deletable via a raw FK cascade — that policy belongs in the
    # future admin layer, not the DB default.
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False
    )
    rating_avg: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    rating_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    category: Mapped["Category"] = relationship("Category", back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )
    specs: Mapped[list["ProductSpec"]] = relationship(
        "ProductSpec",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductSpec.sort_order",
    )
