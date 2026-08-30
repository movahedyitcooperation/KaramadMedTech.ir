from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.schemas.cart import CartRead


class RequestOtpRequest(BaseModel):
    contact: str


class RequestOtpResponse(BaseModel):
    contact: str
    channel: Literal["phone", "email"]
    expires_in: int


class VerifyOtpRequest(BaseModel):
    contact: str
    code: str
    guest_cart_token: str | None = None


class VerifyOtpResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    contact: str
    cart: CartRead
