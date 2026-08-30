import uuid

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.customer_auth import bearer_scheme
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.cart_item import CartItem
from app.models.cart_session import CartSession
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemRead, CartItemUpdate, CartRead

router = APIRouter()

_LOAD_OPTS = (selectinload(CartSession.items).selectinload(CartItem.product).selectinload(Product.images),)


async def get_cart_owner(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    x_guest_cart_token: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> CartSession:
    """Resolves (and lazily creates) the caller's CartSession — logged-in
    customers via the Bearer token, guests via the X-Guest-Cart-Token header
    the frontend forwards from its guest_cart_token cookie (minted by
    middleware.ts). A Bearer token always wins if present."""
    if credentials is not None:
        try:
            claims = decode_access_token(credentials.credentials)
        except JWTError:
            raise HTTPException(status_code=401, detail="Not authenticated")
        if claims.get("role") != "CUSTOMER":
            raise HTTPException(status_code=403, detail="Customer access required")
        user_id = uuid.UUID(claims["sub"])
        cart = (
            await db.execute(select(CartSession).where(CartSession.user_id == user_id).options(*_LOAD_OPTS))
        ).scalar_one_or_none()
        if cart is None:
            cart = CartSession(user_id=user_id)
            db.add(cart)
            await db.commit()
            cart = (
                await db.execute(select(CartSession).where(CartSession.id == cart.id).options(*_LOAD_OPTS))
            ).scalar_one()
        return cart

    if not x_guest_cart_token:
        raise HTTPException(status_code=400, detail={"code": "missing_cart_token"})
    cart = (
        await db.execute(select(CartSession).where(CartSession.guest_token == x_guest_cart_token).options(*_LOAD_OPTS))
    ).scalar_one_or_none()
    if cart is None:
        cart = CartSession(guest_token=x_guest_cart_token)
        db.add(cart)
        await db.commit()
        cart = (
            await db.execute(select(CartSession).where(CartSession.id == cart.id).options(*_LOAD_OPTS))
        ).scalar_one()
    return cart


def _to_cart_read(cart: CartSession) -> CartRead:
    return CartRead(
        id=cart.id,
        items=[
            CartItemRead(
                product_id=ci.product_id,
                slug=ci.product.slug,
                name=ci.product.name,
                image=ci.product.images[0].url if ci.product.images else None,
                unit_price=ci.product.price,
                qty=ci.qty,
                stock=ci.product.stock,
            )
            for ci in cart.items
        ],
    )


async def _reload(db: AsyncSession, cart_id: uuid.UUID) -> CartRead:
    # expire_on_commit=False (core/database.py) means the CartSession object
    # already in this request's identity map (from get_cart_owner) is NOT
    # marked stale after the commit above — a plain re-SELECT can silently
    # hand back its still-cached, pre-mutation `items` collection instead of
    # the just-committed rows. populate_existing=True forces THIS query to
    # overwrite that cached state — deliberately more targeted than
    # db.expire_all()/db.expire(), which would also mark unrelated objects
    # in this request's identity map as expired and risk a later
    # synchronous lazy-load outside an explicit await (SQLAlchemy's
    # MissingGreenlet on an async engine).
    cart = (
        await db.execute(
            select(CartSession)
            .where(CartSession.id == cart_id)
            .options(*_LOAD_OPTS)
            .execution_options(populate_existing=True)
        )
    ).scalar_one()
    return _to_cart_read(cart)


@router.get("/", response_model=CartRead)
async def get_cart(cart: CartSession = Depends(get_cart_owner)):
    return _to_cart_read(cart)


@router.post("/items", response_model=CartRead)
async def add_item(
    payload: CartItemCreate, cart: CartSession = Depends(get_cart_owner), db: AsyncSession = Depends(get_db)
):
    product = await db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail={"code": "product_not_found"})

    existing = next((ci for ci in cart.items if ci.product_id == payload.product_id), None)
    if existing:
        existing.qty = min(existing.qty + payload.qty, product.stock)
    else:
        db.add(CartItem(cart_id=cart.id, product_id=payload.product_id, qty=min(payload.qty, product.stock)))
    await db.commit()
    return await _reload(db, cart.id)


@router.patch("/items/{product_id}", response_model=CartRead)
async def update_item(
    product_id: uuid.UUID,
    payload: CartItemUpdate,
    cart: CartSession = Depends(get_cart_owner),
    db: AsyncSession = Depends(get_db),
):
    item = next((ci for ci in cart.items if ci.product_id == product_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail={"code": "cart_item_not_found"})
    item.qty = max(1, min(payload.qty, item.product.stock))
    await db.commit()
    return await _reload(db, cart.id)


@router.delete("/items/{product_id}", response_model=CartRead)
async def remove_item(
    product_id: uuid.UUID, cart: CartSession = Depends(get_cart_owner), db: AsyncSession = Depends(get_db)
):
    item = next((ci for ci in cart.items if ci.product_id == product_id), None)
    if item is not None:
        await db.delete(item)
        await db.commit()
    return await _reload(db, cart.id)
