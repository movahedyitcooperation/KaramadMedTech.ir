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


# --- admin write schemas (Phase 8 — admin panel) ---------------------------


class ProductImageWrite(BaseModel):
    url: str
    alt: str
    # No sort_order field — the backend assigns it from array position on
    # write (enumerate() index), so the admin ImageUploader only ever needs
    # to reorder an in-memory array, never track a numeric field itself.


class ProductSpecWrite(BaseModel):
    group: str
    key: str
    value: str


class ProductCreate(BaseModel):
    slug: str
    name: str
    brand: str | None = None
    short_desc: str | None = None
    description: list[str] = []
    price: int
    compare_at_price: int | None = None
    stock: int = 0
    sku: str
    is_active: bool = True
    is_featured: bool = False
    category_id: uuid.UUID
    images: list[ProductImageWrite] = []
    specs: list[ProductSpecWrite] = []


class ProductUpdate(BaseModel):
    """All fields optional — PATCH semantics via the route handler's
    `.model_dump(exclude_unset=True)`, NOT `exclude_none`. This distinguishes
    "field omitted" (leave untouched) from "field explicitly set to null"
    (e.g. compare_at_price: null legitimately clears a sale price)."""

    slug: str | None = None
    name: str | None = None
    brand: str | None = None
    short_desc: str | None = None
    description: list[str] | None = None
    price: int | None = None
    compare_at_price: int | None = None
    stock: int | None = None
    sku: str | None = None
    is_active: bool | None = None
    is_featured: bool | None = None
    category_id: uuid.UUID | None = None
    images: list[ProductImageWrite] | None = None
    specs: list[ProductSpecWrite] | None = None
