import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.product import Product
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewListResult, ReviewRead, ReviewSubmitResponse

router = APIRouter()

# Same shape as customer_auth.py's PHONE_RE, duplicated rather than imported:
# that module's regex is scoped to OTP contact classification (phone OR
# email), while this one is a single optional field with its own meaning
# ("a number to follow up on this review"). Coupling the two would make an
# unrelated future change to OTP contact rules silently affect review
# validation.
PHONE_RE = re.compile(r"^09\d{9}$")

NAME_MAX_LEN = 100
BODY_MAX_LEN = 4000


def _validate_submission(payload: ReviewCreate) -> None:
    name = payload.reviewer_name.strip()
    body = payload.body.strip()
    if not (1 <= len(name) <= NAME_MAX_LEN):
        raise HTTPException(status_code=422, detail={"code": "invalid_reviewer_name"})
    if not (1 <= len(body) <= BODY_MAX_LEN):
        raise HTTPException(status_code=422, detail={"code": "invalid_review_body"})
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=422, detail={"code": "invalid_rating"})
    if payload.reviewer_phone and not PHONE_RE.match(payload.reviewer_phone.strip()):
        raise HTTPException(status_code=422, detail={"code": "invalid_reviewer_phone"})


async def _enforce_rate_limit(db: AsyncSession, ip: str | None) -> None:
    if not ip:
        return
    window_start = datetime.now(timezone.utc) - timedelta(hours=1)
    count = (
        await db.execute(
            select(func.count())
            .select_from(Review)
            .where(Review.request_ip == ip, Review.created_at >= window_start)
        )
    ).scalar_one()
    if count >= settings.REVIEW_MAX_SUBMISSIONS_PER_IP_PER_HOUR:
        raise HTTPException(status_code=429, detail={"code": "review_rate_limited"})


@router.post("/", response_model=ReviewSubmitResponse, status_code=201)
async def submit_review(payload: ReviewCreate, request: Request, db: AsyncSession = Depends(get_db)):
    _validate_submission(payload)

    product_exists = (
        await db.execute(select(Product.id).where(Product.id == payload.product_id))
    ).scalar_one_or_none()
    if product_exists is None:
        raise HTTPException(status_code=404, detail={"code": "product_not_found"})

    client_ip = request.client.host if request.client else None
    await _enforce_rate_limit(db, client_ip)

    review = Review(
        product_id=payload.product_id,
        reviewer_name=payload.reviewer_name.strip(),
        reviewer_phone=payload.reviewer_phone.strip() if payload.reviewer_phone else None,
        rating=payload.rating,
        body=payload.body.strip(),
        status="pending",
        request_ip=client_ip,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ReviewSubmitResponse(id=review.id, status=review.status)


@router.get("/", response_model=ReviewListResult)
async def list_reviews(
    product_id: uuid.UUID = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    # Approved only — this is the public listing. A pending or rejected
    # review is never returned here, by construction, not by a caller-passed
    # filter (there is no ?status= param on this route at all).
    stmt = select(Review).where(Review.product_id == product_id, Review.status == "approved")
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = stmt.order_by(Review.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = (await db.execute(stmt)).scalars().all()
    return ReviewListResult(items=items, total=total, page=page, page_size=page_size)
