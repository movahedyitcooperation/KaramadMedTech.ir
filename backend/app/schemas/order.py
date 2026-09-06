from __future__ import annotations

import uuid

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


class OrderListResult(BaseModel):
    items: list[OrderRead]
    total: int
    page: int
    page_size: int


class CheckoutRequest(BaseModel):
    address_id: uuid.UUID
