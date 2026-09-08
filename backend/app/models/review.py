import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

# No relationship to Product (deliberately, matching OtpCode's own no-
# relationships style): every place that needs product/review together
# (admin_reviews.py's moderation list) does a plain join, not eager loading —
# there's exactly one such place, not enough call sites to justify a
# relationship attribute.
#
# reviewer_name/reviewer_phone are plain strings, not a User FK — reviews are
# a public, unauthenticated submission (name + optional phone, matching the
# reference design's review form), not tied to a customer account. A phone
# number collected here is for the shop's own follow-up, never rendered
# publicly (see schemas/review.py's ReviewRead, which omits it).


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reviewer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    reviewer_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    # pending -> approved | rejected. No stricter state machine than that —
    # unlike Order.status, a review has no side effects (stock, payment) that
    # need transition guarding, so a moderator can freely move a review
    # between approved/rejected to correct a mistake.
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    request_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)  # 45 = max IPv6 text length

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating_range"),
        # Serves the public listing (product_id + status='approved', newest
        # first) — the moderation queue additionally filters by status alone
        # across all products, which this index's leading columns don't serve
        # as well, but that list is admin-only and low-volume.
        Index("ix_reviews_product_status_created", "product_id", "status", "created_at"),
        Index("ix_reviews_ip_created_at", "request_ip", "created_at"),
    )
