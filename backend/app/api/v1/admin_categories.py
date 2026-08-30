import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_admin
from app.core.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.get("/", response_model=list[CategoryRead])
async def admin_list_categories(db: AsyncSession = Depends(get_db)):
    # Flat, all categories (active + inactive) — admin builds its own
    # indented tree view client-side from parent_id. No pagination: category
    # count is small (~30) and won't grow the way products will.
    stmt = select(Category).order_by(Category.sort_order)
    return (await db.execute(stmt)).scalars().all()


@router.get("/{category_id}", response_model=CategoryRead)
async def admin_get_category(category_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=CategoryRead, status_code=201)
async def create_category(payload: CategoryCreate, db: AsyncSession = Depends(get_db)):
    category = Category(**payload.model_dump())
    db.add(category)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Slug already exists")
    await db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(category_id: uuid.UUID, payload: CategoryUpdate, db: AsyncSession = Depends(get_db)):
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Slug already exists")
    await db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    # Proactive check -> clean, specific 409 message (primary path). Note:
    # Category.parent_id is ON DELETE SET NULL (deleting a parent with
    # children is already fine — they become top-level automatically), so
    # only the Product.category_id RESTRICT case needs guarding here.
    product_count = (
        await db.execute(select(func.count()).select_from(Product).where(Product.category_id == category_id))
    ).scalar_one()
    if product_count > 0:
        # Structured, not prose: the frontend owns all user-facing text (this
        # app is Persian-only) and maps this code to a Persian string. A raw
        # English detail string would otherwise leak straight into the UI.
        raise HTTPException(
            status_code=409,
            detail={"code": "category_has_products", "product_count": product_count},
        )

    await db.delete(category)
    try:
        await db.commit()
    except IntegrityError:
        # Defensive fallback for a race between the count check and this
        # commit — the DB's own ON DELETE RESTRICT is the real backstop either way.
        await db.rollback()
        raise HTTPException(status_code=409, detail={"code": "category_has_products"})
