from __future__ import annotations

import uuid

from pydantic import BaseModel


class PaymentRequestBody(BaseModel):
    order_id: uuid.UUID


class PaymentRequestResponse(BaseModel):
    payment_url: str
