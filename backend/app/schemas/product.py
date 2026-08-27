from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict


class ProductImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    alt: str
    sort_order: int


class ProductSpecRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    group: str
    key: str
    value: str
    sort_order: int


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    brand: str | None
    short_desc: str | None
    description: list[str]
    price: int
    compare_at_price: int | None
    stock: int
    sku: str
    is_active: bool
    is_featured: bool
    category_id: uuid.UUID
    rating_avg: float
    rating_count: int
    images: list[ProductImageRead]
    specs: list[ProductSpecRead]


class ProductListResult(BaseModel):
    """Mirrors the frontend's ProductListResult TS type (lib/db/products.ts):
    { items, total, page, pageSize } — field-for-field, aside from the
    snake_case rename of pageSize -> page_size (see the API-casing note in
    app/schemas/settings.py)."""

    items: list[ProductRead]
    total: int
    page: int
    page_size: int
