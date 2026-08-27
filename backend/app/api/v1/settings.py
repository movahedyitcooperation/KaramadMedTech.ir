from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.settings import Setting
from app.schemas.settings import SiteSettings

router = APIRouter()


@router.get("/", response_model=SiteSettings)
async def get_settings(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Setting))).scalars().all()
    values = {row.key: row.value for row in rows}
    return SiteSettings(
        shipping=values.get("shipping", {}),
        contact=values.get("contact", {}),
        social=values.get("social", {}),
        hero_slides=values.get("hero_slides", []),
    )
