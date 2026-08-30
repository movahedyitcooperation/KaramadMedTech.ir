from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base

# Plain autoincrement int PK: rows are never addressed by id, only ever
# queried by (contact)/(request_ip) + created_at — same reasoning as
# ProductImage/ProductSpec. No TimestampMixin: only `created_at` is needed —
# rows are otherwise mutated in place (attempts/consumed_at), not "updated"
# in the audit-trail sense TimestampMixin implies elsewhere.


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contact: Mapped[str] = mapped_column(String(255), nullable=False)  # normalized phone (09xxxxxxxxx) or lowercased email
    channel: Mapped[str] = mapped_column(String(10), nullable=False)  # "phone" | "email"
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    request_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)  # 45 = max IPv6 text length
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_otp_codes_contact_created_at", "contact", "created_at"),
        Index("ix_otp_codes_ip_created_at", "request_ip", "created_at"),
    )
