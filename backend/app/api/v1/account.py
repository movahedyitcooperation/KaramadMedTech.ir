import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.customer_auth import get_current_customer
from app.core.database import get_db
from app.models.address import Address
from app.models.user import User
from app.schemas.account import AddressCreate, AddressRead, AddressUpdate, UserRead, UserUpdate

router = APIRouter(dependencies=[Depends(get_current_customer)])


@router.get("/me", response_model=UserRead)
async def get_me(user: User = Depends(get_current_customer)):
    return user


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate, user: User = Depends(get_current_customer), db: AsyncSession = Depends(get_db)
):
    # Only full_name is editable — the login identity (phone/email) can't be
    # changed here; that would need a re-verification flow, out of scope.
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/addresses", response_model=list[AddressRead])
async def list_addresses(user: User = Depends(get_current_customer), db: AsyncSession = Depends(get_db)):
    stmt = select(Address).where(Address.user_id == user.id).order_by(Address.created_at.desc())
    return (await db.execute(stmt)).scalars().all()


async def _clear_other_defaults(db: AsyncSession, user_id: uuid.UUID, keep_id: uuid.UUID | None) -> None:
    stmt = update(Address).where(Address.user_id == user_id)
    if keep_id is not None:
        stmt = stmt.where(Address.id != keep_id)
    await db.execute(stmt.values(is_default=False))


@router.post("/addresses", response_model=AddressRead, status_code=201)
async def create_address(
    payload: AddressCreate, user: User = Depends(get_current_customer), db: AsyncSession = Depends(get_db)
):
    address = Address(user_id=user.id, **payload.model_dump())
    db.add(address)
    if payload.is_default:
        await _clear_other_defaults(db, user.id, keep_id=None)
    await db.commit()
    await db.refresh(address)
    return address


@router.get("/addresses/{address_id}", response_model=AddressRead)
async def get_address(
    address_id: uuid.UUID, user: User = Depends(get_current_customer), db: AsyncSession = Depends(get_db)
):
    address = await db.get(Address, address_id)
    # SECURITY: a customer must never reach another customer's address by
    # guessing a UUID — the ownership check is not optional.
    if address is None or address.user_id != user.id:
        raise HTTPException(status_code=404, detail="Address not found")
    return address


@router.patch("/addresses/{address_id}", response_model=AddressRead)
async def update_address(
    address_id: uuid.UUID,
    payload: AddressUpdate,
    user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    address = await db.get(Address, address_id)
    if address is None or address.user_id != user.id:  # SECURITY: ownership check
        raise HTTPException(status_code=404, detail="Address not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(address, field, value)
    if payload.is_default:
        await _clear_other_defaults(db, user.id, keep_id=address.id)
    await db.commit()
    await db.refresh(address)
    return address


@router.delete("/addresses/{address_id}", status_code=204)
async def delete_address(
    address_id: uuid.UUID, user: User = Depends(get_current_customer), db: AsyncSession = Depends(get_db)
):
    address = await db.get(Address, address_id)
    if address is None or address.user_id != user.id:  # SECURITY: ownership check
        raise HTTPException(status_code=404, detail="Address not found")
    await db.delete(address)
    await db.commit()
