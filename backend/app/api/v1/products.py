import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.product import ProductListResult, ProductRead

router = APIRouter()

SortOption = Literal["newest", "cheapest", "expensive", "rating"]


async def _resolve_subtree_ids(db: AsyncSession, category_slug: str) -> list[uuid.UUID]:
    """Mirrors the frontend's getCategoryIdsInSubtree (lib/db/categories.ts):
    the category itself plus its direct children only — the real data is a
    2-level tree. Not a recursive descendant walk; update this if categories
    ever nest deeper than 2 levels."""
    root = (await db.execute(select(Category).where(Category.slug == category_slug))).scalar_one_or_none()
    if root is None:
        raise HTTPException(status_code=404, detail="Category not found")
    child_ids = (await db.execute(select(Category.id).where(Category.parent_id == root.id))).scalars().all()
    return [root.id, *child_ids]


@router.get("/", response_model=ProductListResult)
async def list_products(
    db: AsyncSession = Depends(get_db),
    category_slug: str | None = Query(None),
    price_min: int | None = Query(None, ge=0),
    price_max: int | None = Query(None, ge=0),
    brands: list[str] | None = Query(None),
    in_stock_only: bool = Query(False),
    sort: SortOption = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
):
    """Mirrors the frontend's ProductListFilters shape (lib/db/products.ts)
    field-for-field: category_slug/price_min/price_max/brands/in_stock_only/
    sort/page/page_size <-> categorySlug/priceMin/priceMax/brands/
    inStockOnly/sort/page/pageSize, same filter semantics and same defaults
    (page=1, page_size=12).

    `brands` is passed as a repeated query param, e.g. ?brands=Omron&brands=Beurer.
    """
    stmt = select(Product).where(Product.is_active.is_(True))

    if category_slug:
        ids = await _resolve_subtree_ids(db, category_slug)
        stmt = stmt.where(Product.category_id.in_(ids))
    if price_min is not None:
        stmt = stmt.where(Product.price >= price_min)
    if price_max is not None:
        stmt = stmt.where(Product.price <= price_max)
    if brands:
        stmt = stmt.where(Product.brand.in_(brands))
    if in_stock_only:
        stmt = stmt.where(Product.stock > 0)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()

    # "newest" is ORDER BY created_at DESC rather than a literal port of the
    # mock's `[...all].reverse()` — the mock has no timestamp concept at all,
    # so created_at DESC is the correct real-DB equivalent of "newest first,"
    # not a mechanical translation.
    sort_map = {
        "cheapest": Product.price.asc(),
        "expensive": Product.price.desc(),
        "rating": Product.rating_avg.desc(),
        "newest": Product.created_at.desc(),
    }
    stmt = (
        stmt.order_by(sort_map[sort])
        .options(selectinload(Product.images), selectinload(Product.specs))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return ProductListResult(items=items, total=total, page=page, page_size=page_size)


@router.get("/{slug}", response_model=ProductRead)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Product)
        .where(Product.slug == slug, Product.is_active.is_(True))
        .options(selectinload(Product.images), selectinload(Product.specs))
    )
    product = (await db.execute(stmt)).scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
