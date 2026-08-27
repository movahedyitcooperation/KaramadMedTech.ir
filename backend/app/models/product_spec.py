import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

# Same "plain int PK" reasoning as ProductImage — specs are only ever read
# nested under a product.
#
# Note: the `group` column name is a reserved SQL keyword (GROUP BY).
# SQLAlchemy's Postgres dialect auto-quotes reserved identifiers in generated
# DDL, so this works without extra configuration — verify the migration
# quotes it as "group" when reviewing (see alembic/versions/0001_initial_schema.py).


class ProductSpec(Base):
    __tablename__ = "product_specs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    group: Mapped[str] = mapped_column(String(120), nullable=False)
    key: Mapped[str] = mapped_column(String(120), nullable=False)
    value: Mapped[str] = mapped_column(String(300), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="specs")
