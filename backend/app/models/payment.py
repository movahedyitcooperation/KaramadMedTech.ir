import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

# One row per payment ATTEMPT, not per order — an order can have several if
# the customer abandons checkout and retries. `authority` (ZarinPal's own
# transaction reference) is the idempotency key the callback verifies
# against, not order_id — this is what stops a duplicated/retried callback
# from double-marking an order paid, mirroring the same care already taken
# around the OTP/cart work's double-submission guards.


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(20), nullable=False)  # "zarinpal" | "mock"
    authority: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending | verified | failed
    ref_id: Mapped[str | None] = mapped_column(String(64), nullable=True)  # ZarinPal's ref_id, set only once verified
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="payments")
