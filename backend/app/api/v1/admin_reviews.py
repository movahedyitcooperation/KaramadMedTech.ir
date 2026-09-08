import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_admin
from app.core.database import get_db
from app.models.product import Product
from app.models.review import Review
from app.schemas.review import AdminReviewListResult, AdminReviewRead, AdminReviewStatusUpdate

router = APIRouter(dependencies=[Depends(get_current_admin)])

_ALLOWED_STATUSES = {"pending", "approved", "rejected"}


async def _recompute_product_rating(db: AsyncSession, product_id: uuid.UUID) -> None:
    """The one place rating_avg/rating_count are written — every approve or
    reject calls this rather than incrementing/decrementing in place, so a
    moderator flip-flopping a review's status can never drift the aggregate
    out of sync with what's actually approved."""
    avg_rating, count = (
        await db.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.product_id == product_id, Review.status == "approved"
            )
        )
    ).one()
    await db.execute(
        update(Product)
        .where(Product.id == product_id)
        .values(rating_avg=round(float(avg_rating), 1) if avg_rating is not None else 0.0, rating_count=count)
    )


def _to_admin_read(review: Review, product_name: str, product_slug: str) -> AdminReviewRead:
    return AdminReviewRead(
        id=review.id,
        product_id=review.product_id,
        product_name=product_name,
        product_slug=product_slug,
        reviewer_name=review.reviewer_name,
        reviewer_phone=review.reviewer_phone,
        rating=review.rating,
        body=review.body,
        status=review.status,
        created_at=review.created_at,
    )


@router.get("/", response_model=AdminReviewListResult)
async def admin_list_reviews(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Review, Product.name, Product.slug).join(Product, Review.product_id == Product.id)
    if status:
        stmt = stmt.where(Review.status == status)
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = stmt.order_by(Review.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).all()
    items = [_to_admin_read(review, name, slug) for review, name, slug in rows]
    return AdminReviewListResult(items=items, total=total, page=page, page_size=page_size)


@router.patch("/{review_id}", response_model=AdminReviewRead)
async def admin_update_review_status(
    review_id: uuid.UUID, payload: AdminReviewStatusUpdate, db: AsyncSession = Depends(get_db)
):
    if payload.status not in _ALLOWED_STATUSES:
        raise HTTPException(status_code=422, detail={"code": "invalid_review_status"})

    row = (
        await db.execute(
            select(Review, Product.name, Product.slug)
            .join(Product, Review.product_id == Product.id)
            .where(Review.id == review_id)
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Review not found")
    review, product_name, product_slug = row

    review.status = payload.status
    await _recompute_product_rating(db, review.product_id)
    await db.commit()

    reloaded = (
        await db.execute(
            select(Review).where(Review.id == review.id).execution_options(populate_existing=True)
        )
    ).scalar_one()
    return _to_admin_read(reloaded, product_name, product_slug)
