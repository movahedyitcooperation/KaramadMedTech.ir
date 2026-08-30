from __future__ import annotations

import uuid

from pydantic import BaseModel


class CartItemRead(BaseModel):
    product_id: uuid.UUID
    slug: str
    name: str
    image: str | None
    unit_price: int
    qty: int
    stock: int


class CartRead(BaseModel):
    id: uuid.UUID
    items: list[CartItemRead]


class CartItemCreate(BaseModel):
    product_id: uuid.UUID
    qty: int = 1


class CartItemUpdate(BaseModel):
    qty: int
