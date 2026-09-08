from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReviewCreate(BaseModel):
    product_id: uuid.UUID
    reviewer_name: str
    reviewer_phone: str | None = None
    rating: int
    body: str


class ReviewSubmitResponse(BaseModel):
    """Deliberately not the full ReviewRead shape — a pending review isn't
    publicly listable, but the submitter still needs to know their note was
    received and is awaiting moderation."""

    id: uuid.UUID
    status: str


class ReviewRead(BaseModel):
    """The public shape — approved reviews only (see reviews.py's list
    endpoint). No reviewer_phone (collected for the shop's own follow-up,
    never displayed) and no status (every row returned here is already
    'approved' by construction)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reviewer_name: str
    rating: int
    body: str
    created_at: datetime


class ReviewListResult(BaseModel):
    items: list[ReviewRead]
    total: int
    page: int
    page_size: int


class AdminReviewRead(BaseModel):
    """Everything a moderator needs: the full ReviewRead fields plus the
    phone number, status, and which product this is about — product_name/
    product_slug aren't columns on Review, the endpoint fills them in from a
    join against Product."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_slug: str
    reviewer_name: str
    reviewer_phone: str | None
    rating: int
    body: str
    status: str
    created_at: datetime


class AdminReviewListResult(BaseModel):
    items: list[AdminReviewRead]
    total: int
    page: int
    page_size: int


class AdminReviewStatusUpdate(BaseModel):
    status: str
