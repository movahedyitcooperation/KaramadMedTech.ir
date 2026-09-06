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


class FacetValue(BaseModel):
    """One selectable value in a facet, with how many products carry it."""

    value: str
    #: Human-readable name where `value` is a machine key (a category slug);
    #: None where the value is already the label (a brand name).
    label: str | None = None
    count: int


class ProductFacets(BaseModel):
    """Counts for the filters the storefront offers, computed over the SAME
    filtered set as `items`.

    Each facet is counted with every *other* active filter applied but not its
    own — the standard e-commerce semantic, and the only one that makes the
    numbers useful: with `brands=Omron` selected, the brand facet still shows
    what picking Beurer *instead* would yield, while the category facet
    already reflects the Omron narrowing.

    Every facet here is one GROUP BY over the shared filtered subquery, so the
    number of round trips is fixed no matter how many brands or categories
    exist. Returned only when the caller asks (`include_facets=true`), so the
    home carousels don't pay for aggregates they never read.
    """

    #: Distinct brands present, descending by count then alphabetical.
    brands: list[FacetValue]
    #: Top-level departments, with sub-category hits folded into their parent.
    #: Counted with the category filter dropped, so a shopper can see what
    #: switching department would give.
    categories: list[FacetValue]
    #: Sub-categories of the *selected* department, for its sidebar. Empty
    #: when no `category_slug` was given — there is nothing to scope it to.
    #: Counted with the department constraint kept but the specific
    #: sub-category dropped, so switching sub-category is likewise previewable.
    subcategories: list[FacetValue]
    #: How many of the matching products are actually in stock.
    in_stock: int
    #: Cheapest and dearest match, for a price-range hint. Null on no matches.
    price_min: int | None = None
    price_max: int | None = None


class ProductListResult(BaseModel):
    """Mirrors the frontend's ProductListResult TS type (lib/db/products.ts):
    { items, total, page, pageSize } — field-for-field, aside from the
    snake_case rename of pageSize -> page_size (see the API-casing note in
    app/schemas/settings.py).

    `facets` is absent unless `include_facets=true` was passed, which keeps
    the response backward compatible for every existing caller."""

    items: list[ProductRead]
    total: int
    page: int
    page_size: int
    facets: ProductFacets | None = None


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
