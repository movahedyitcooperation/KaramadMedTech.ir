import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Select, and_, func, literal, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.core.database import get_db
from app.core.search import NORMALISE_FROM, NORMALISE_TO, tokenize_query
from app.models.category import Category
from app.models.product import Product
from app.schemas.product import (
    FacetValue,
    ProductFacets,
    ProductListResult,
    ProductRead,
)

router = APIRouter()

SortOption = Literal["newest", "cheapest", "expensive", "rating"]


async def _resolve_subtree_ids(
    db: AsyncSession, category_slug: str
) -> tuple[list[uuid.UUID], list[uuid.UUID]]:
    """Resolves a category slug to (its own subtree, its department subtree).

    The tree is exactly two levels, so a subtree is "the category plus its
    direct children" — not a recursive descendant walk; update this if
    categories ever nest deeper.

    The second list is the subtree of the *top-level department* the slug
    belongs to. For a department slug the two are identical; for a
    sub-category slug the first is just that sub-category while the second
    covers all of its siblings. The sub-category facet needs the department
    scope so switching sibling is previewable.
    """
    selected = (
        await db.execute(select(Category).where(Category.slug == category_slug))
    ).scalar_one_or_none()
    if selected is None:
        raise HTTPException(status_code=404, detail="Category not found")

    root_id = selected.parent_id or selected.id
    root_children = (
        await db.execute(select(Category.id).where(Category.parent_id == root_id))
    ).scalars().all()
    department_ids = [root_id, *root_children]

    if selected.parent_id is None:
        return department_ids, department_ids
    return [selected.id], department_ids


def searchable_expression():
    """The normalised haystack every search token is matched against.

    Name, brand, short description and SKU concatenated, then folded through
    the same `translate()` the query goes through in Python
    (app/core/search.py). Built as an expression rather than a stored column
    so there is nothing to keep in sync on write — migration 0004 declares a
    GIN trigram index over this exact expression, so Postgres can use it for
    the LIKE below instead of scanning every row.
    """
    haystack = (
        func.coalesce(Product.name, "")
        + literal(" ")
        + func.coalesce(Product.brand, "")
        + literal(" ")
        + func.coalesce(Product.short_desc, "")
        + literal(" ")
        + func.coalesce(Product.sku, "")
    )
    return func.lower(func.translate(haystack, NORMALISE_FROM, NORMALISE_TO))


def _apply_filters(
    stmt: Select,
    *,
    category_ids: list[uuid.UUID] | None,
    price_min: int | None,
    price_max: int | None,
    brands: list[str] | None,
    in_stock_only: bool,
    is_featured: bool | None,
    tokens: list[str],
) -> Select:
    """The one place a product filter is expressed.

    Every caller — the item page, the total, and each facet aggregate — builds
    from this, passing None for the single dimension it wants to leave open.
    That is what keeps a facet's counts consistent with the other active
    filters without duplicating the WHERE clause four times.
    """
    if category_ids is not None:
        stmt = stmt.where(Product.category_id.in_(category_ids))
    if price_min is not None:
        stmt = stmt.where(Product.price >= price_min)
    if price_max is not None:
        stmt = stmt.where(Product.price <= price_max)
    if brands:
        stmt = stmt.where(Product.brand.in_(brands))
    if in_stock_only:
        stmt = stmt.where(Product.stock > 0)
    if is_featured is not None:
        stmt = stmt.where(Product.is_featured.is_(is_featured))
    if tokens:
        searchable = searchable_expression()
        # AND across tokens, substring within each: «فشارسنج امرن» matches
        # regardless of the order the two words appear in the product name.
        stmt = stmt.where(and_(*[searchable.like(f"%{token}%") for token in tokens]))
    return stmt


@router.get("/", response_model=ProductListResult)
async def list_products(
    db: AsyncSession = Depends(get_db),
    q: str | None = Query(
        None,
        max_length=120,
        description="Free-text search over name, brand, short description and SKU.",
    ),
    category_slug: str | None = Query(None),
    price_min: int | None = Query(None, ge=0),
    price_max: int | None = Query(None, ge=0),
    brands: list[str] | None = Query(None),
    in_stock_only: bool = Query(False),
    is_featured: bool | None = Query(
        None,
        description="true = featured only, false = non-featured only. Omit for both.",
    ),
    include_facets: bool = Query(
        False,
        description="Also return brand/category/stock/price facet counts for the filtered set.",
    ),
    sort: SortOption = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
):
    """List products.

    Every filter is applied in SQL — the storefront never narrows a result set
    client-side. `brands` is a repeated query param
    (`?brands=Omron&brands=Beurer`).

    All parameters are optional and additive, so this stays backward
    compatible: `q`, `is_featured` and `include_facets` were added after the
    storefront shipped, and omitting them reproduces the previous behaviour
    exactly — including the response body, since `facets` is null unless asked
    for.
    """
    tokens = tokenize_query(q) if q else []
    category_ids: list[uuid.UUID] | None = None
    department_ids: list[uuid.UUID] | None = None
    if category_slug:
        category_ids, department_ids = await _resolve_subtree_ids(db, category_slug)

    filter_kwargs: dict[str, Any] = dict(
        category_ids=category_ids,
        price_min=price_min,
        price_max=price_max,
        brands=brands,
        in_stock_only=in_stock_only,
        is_featured=is_featured,
        tokens=tokens,
    )

    base = select(Product).where(Product.is_active.is_(True))
    stmt = _apply_filters(base, **filter_kwargs)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()

    # "newest" is ORDER BY created_at DESC — the real-DB equivalent of the
    # frontend's original "newest first", not a mechanical port of it.
    sort_map = {
        "cheapest": Product.price.asc(),
        "expensive": Product.price.desc(),
        "rating": Product.rating_avg.desc(),
        "newest": Product.created_at.desc(),
    }
    # Product.id is the tiebreaker on EVERY sort, and it is load-bearing, not
    # tidiness: none of the four sort keys is unique (the seed inserts the
    # whole catalog in one transaction, so all 15 rows share a created_at, and
    # prices and ratings repeat freely). With a non-unique ORDER BY, Postgres
    # is free to return tied rows in a different order for each OFFSET query,
    # which makes page 2 repeat or skip products from page 1. A unique final
    # key gives every page a total order to slice.
    page_stmt = (
        stmt.order_by(sort_map[sort], Product.id.asc())
        .options(selectinload(Product.images), selectinload(Product.specs))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = (await db.execute(page_stmt)).scalars().all()

    facets = (
        await _build_facets(db, base, filter_kwargs, department_ids) if include_facets else None
    )

    return ProductListResult(items=items, total=total, page=page, page_size=page_size, facets=facets)


async def _build_facets(
    db: AsyncSession,
    base: Select,
    filter_kwargs: dict[str, Any],
    department_ids: list[uuid.UUID] | None,
) -> ProductFacets:
    """Five aggregates, each one GROUP BY or one scalar over the shared filter.

    Fixed cost: at most five queries whether the catalog holds fifteen
    products or fifteen thousand, and whether there are six categories or six
    hundred. Deliberately NOT one query per category — that N+1 is what this
    replaces.

    Each aggregate drops exactly the dimension it counts, so a shopper who has
    already checked "Omron" still sees how many Beurer products the rest of
    their filters would match.
    """

    def without(dimension: str) -> Select:
        return _apply_filters(base, **{**filter_kwargs, dimension: None})

    # --- brands -------------------------------------------------------------
    brand_src = without("brands").subquery()
    brand_rows = (
        await db.execute(
            select(brand_src.c.brand, func.count().label("n"))
            .where(brand_src.c.brand.is_not(None))
            .group_by(brand_src.c.brand)
            .order_by(func.count().desc(), brand_src.c.brand.asc())
        )
    ).all()

    # --- categories, folded to their top-level department -------------------
    # One LEFT JOIN to the parent row does the folding: the tree is two levels,
    # so COALESCE(parent, self) is always the department.
    cat_src = without("category_ids").subquery()
    child = aliased(Category)
    parent = aliased(Category)
    dept_slug = func.coalesce(parent.slug, child.slug)
    dept_name = func.coalesce(parent.name, child.name)
    category_rows = (
        await db.execute(
            select(dept_slug.label("slug"), dept_name.label("name"), func.count().label("n"))
            .select_from(cat_src)
            .join(child, child.id == cat_src.c.category_id)
            .outerjoin(parent, parent.id == child.parent_id)
            .group_by(dept_slug, dept_name)
            .order_by(func.count().desc(), dept_name.asc())
        )
    ).all()

    # --- sub-categories of the selected department --------------------------
    # Scoped to the department but with the specific sub-category dropped, and
    # grouped by the product's own (leaf) category, so the sidebar can show
    # "what would each sibling give me". Skipped entirely when no category is
    # selected: there would be nothing to scope it to.
    subcategory_rows: list[Any] = []
    if department_ids:
        sub_src = _apply_filters(
            base, **{**filter_kwargs, "category_ids": department_ids}
        ).subquery()
        leaf = aliased(Category)
        subcategory_rows = (
            await db.execute(
                select(leaf.slug, leaf.name, func.count().label("n"))
                .select_from(sub_src)
                .join(leaf, leaf.id == sub_src.c.category_id)
                .group_by(leaf.slug, leaf.name, leaf.sort_order)
                .order_by(leaf.sort_order.asc())
            )
        ).all()

    # --- in-stock count -----------------------------------------------------
    stock_src = without("in_stock_only").subquery()
    in_stock = (
        await db.execute(select(func.count()).select_from(stock_src).where(stock_src.c.stock > 0))
    ).scalar_one()

    # --- price bounds -------------------------------------------------------
    # Dropping price_min alone would leave price_max clamping the range, so
    # both bounds come off for this one.
    price_src = _apply_filters(
        base, **{**filter_kwargs, "price_min": None, "price_max": None}
    ).subquery()
    price_row = (
        await db.execute(select(func.min(price_src.c.price), func.max(price_src.c.price)))
    ).one()

    return ProductFacets(
        brands=[FacetValue(value=brand, count=n) for brand, n in brand_rows],
        categories=[
            FacetValue(value=slug, label=name, count=n) for slug, name, n in category_rows
        ],
        subcategories=[
            FacetValue(value=slug, label=name, count=n) for slug, name, n in subcategory_rows
        ],
        in_stock=in_stock,
        price_min=price_row[0],
        price_max=price_row[1],
    )


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
