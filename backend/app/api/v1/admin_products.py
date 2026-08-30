import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_admin
from app.core.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_spec import ProductSpec
from app.schemas.product import ProductCreate, ProductListResult, ProductRead, ProductUpdate

# Mounted at /admin/products — deliberately NOT bolted onto the existing
# public products.py router. A same-shape single-segment route
# (/products/{slug} vs. a hypothetical /products/{product_id}) is a silent
# collision risk with the public GET /products/{slug} route, since Starlette
# matches by path *shape*, not param name/type. Every route here sits at
# least two segments under /products, so it can never collide.
router = APIRouter(dependencies=[Depends(get_current_admin)])

_LOAD_OPTS = (selectinload(Product.images), selectinload(Product.specs))


async def _assert_category_exists(db: AsyncSession, category_id: uuid.UUID) -> None:
    exists = (await db.execute(select(Category.id).where(Category.id == category_id))).scalar_one_or_none()
    if exists is None:
        raise HTTPException(status_code=400, detail="Category does not exist")


@router.get("/", response_model=ProductListResult)
async def admin_list_products(
    db: AsyncSession = Depends(get_db),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    # No is_active filter — unlike the public listing, admin must see
    # inactive/draft products too.
    stmt = select(Product)
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q}%") | Product.sku.ilike(f"%{q}%"))
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = (
        stmt.order_by(Product.created_at.desc())
        .options(*_LOAD_OPTS)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return ProductListResult(items=items, total=total, page=page, page_size=page_size)


@router.get("/{product_id}", response_model=ProductRead)
async def admin_get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.id == product_id).options(*_LOAD_OPTS)
    product = (await db.execute(stmt)).scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductRead, status_code=201)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db)):
    await _assert_category_exists(db, payload.category_id)
    data = payload.model_dump(exclude={"images", "specs"})
    product = Product(
        **data,
        images=[ProductImage(url=i.url, alt=i.alt, sort_order=idx) for idx, i in enumerate(payload.images)],
        specs=[ProductSpec(**s.model_dump(), sort_order=idx) for idx, s in enumerate(payload.specs)],
    )
    db.add(product)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Slug or SKU already exists")
    await db.refresh(product, attribute_names=["images", "specs"])
    return product


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(product_id: uuid.UUID, payload: ProductUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.id == product_id).options(*_LOAD_OPTS)
    product = (await db.execute(stmt)).scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    data = payload.model_dump(exclude_unset=True)
    if data.get("category_id"):
        await _assert_category_exists(db, data["category_id"])
    images, specs = data.pop("images", None), data.pop("specs", None)
    for field, value in data.items():
        setattr(product, field, value)
    # Full-replace-on-update for images/specs: no existing sub-resource
    # pattern to mirror, lists are small, the admin form already holds the
    # full array client-side. Relies on cascade="all, delete-orphan" already
    # configured on Product.images/Product.specs (app/models/product.py).
    # Known trade-off, explicitly deferred: this deletes the DB row for a
    # removed image but not the uploaded file itself — orphaned files
    # accumulate slowly, acceptable at current catalog scale.
    if images is not None:
        product.images = [ProductImage(url=i["url"], alt=i["alt"], sort_order=idx) for idx, i in enumerate(images)]
    if specs is not None:
        product.specs = [ProductSpec(**s, sort_order=idx) for idx, s in enumerate(specs)]

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Slug or SKU already exists")
    await db.refresh(product, attribute_names=["images", "specs"])
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()
