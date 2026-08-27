from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryRead, CategoryTree

router = APIRouter()


@router.get("/", response_model=list[CategoryTree])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Full category tree: active top-level categories with one level of
    active children eager-loaded. See CategoryTree's docstring for why this
    doesn't recurse past 2 levels."""
    stmt = (
        select(Category)
        .where(Category.parent_id.is_(None), Category.is_active.is_(True))
        .options(selectinload(Category.children.and_(Category.is_active.is_(True))))
        .order_by(Category.sort_order)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{slug}", response_model=CategoryRead)
async def get_category(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Category).where(Category.slug == slug, Category.is_active.is_(True))
    category = (await db.execute(stmt)).scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category
