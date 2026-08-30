from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    phone: str | None
    email: str | None
    full_name: str | None


class UserUpdate(BaseModel):
    full_name: str | None = None


class AddressRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    full_name: str
    phone: str
    province: str
    city: str
    address_line: str
    postal_code: str | None
    is_default: bool


class AddressCreate(BaseModel):
    title: str
    full_name: str
    phone: str
    province: str
    city: str
    address_line: str
    postal_code: str | None = None
    is_default: bool = False


class AddressUpdate(BaseModel):
    """All fields optional — PATCH semantics via `.model_dump(exclude_unset=True)`,
    matching the ProductUpdate/CategoryUpdate convention."""

    title: str | None = None
    full_name: str | None = None
    phone: str | None = None
    province: str | None = None
    city: str | None = None
    address_line: str | None = None
    postal_code: str | None = None
    is_default: bool | None = None
