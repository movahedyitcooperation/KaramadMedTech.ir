from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: uuid.UUID | None
    product_name: str
    product_sku: str
    unit_price: int
    qty: int


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_number: str
    address_title: str
    address_full_name: str
    address_phone: str
    address_province: str
    address_city: str
    address_line: str
    address_postal_code: str | None
    subtotal: int
    shipping_cost: int
    total: int
    status: str
    items: list[OrderItemRead]
    created_at: datetime


class OrderListResult(BaseModel):
    items: list[OrderRead]
    total: int
    page: int
    page_size: int


class CheckoutRequest(BaseModel):
    address_id: uuid.UUID


class AdminOrderRead(OrderRead):
    """Everything OrderRead has (created_at included) plus the field only the
    admin panel needs: which customer placed it — there's no ownership check
    to hide `user_id` behind here. `contact` isn't a column on Order — the
    endpoint fills it in from a join against User, since an order snapshots
    the shipping address but not the account's own phone/email."""

    user_id: uuid.UUID
    contact: str


class AdminOrderListResult(BaseModel):
    items: list[AdminOrderRead]
    total: int
    page: int
    page_size: int


class AdminOrderStatusUpdate(BaseModel):
    status: str
