import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.customer_auth import get_current_customer
from app.core.database import get_db
from app.models.address import Address
from app.models.cart_item import CartItem
from app.models.cart_session import CartSession
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.settings import Setting
from app.models.user import User
from app.schemas.order import CheckoutRequest, OrderListResult, OrderRead

router = APIRouter(dependencies=[Depends(get_current_customer)])

_ORDER_LOAD_OPTS = (selectinload(Order.items),)


async def _get_shipping_setting(db: AsyncSession) -> dict:
    row = await db.get(Setting, "shipping")
    return row.value if row else {"mode": "flat", "cost": 0, "free_over": 0}


@router.post("/", response_model=OrderRead, status_code=201)
async def checkout(
    payload: CheckoutRequest, user: User = Depends(get_current_customer), db: AsyncSession = Depends(get_db)
):
    # 1. Address ownership check — security-critical, same pattern as
    # account.py's address routes: a customer must never check out to
    # another customer's address by guessing a UUID.
    address = await db.get(Address, payload.address_id)
    if address is None or address.user_id != user.id:
        raise HTTPException(status_code=404, detail="Address not found")

    # 2. Fetch the customer's cart with live product data.
    cart = (
        await db.execute(
            select(CartSession)
            .where(CartSession.user_id == user.id)
            .options(selectinload(CartSession.items).selectinload(CartItem.product))
        )
    ).scalar_one_or_none()
    if cart is None or not cart.items:
        raise HTTPException(status_code=400, detail={"code": "cart_empty"})

    # 3. Re-validate every line against LIVE product data — CLAUDE.md §5's
    # "never trust the cart, always re-check server-side" rule. Reject the
    # whole checkout if anything changed; simpler and more honest than a
    # partial fulfillment the customer didn't ask for.
    for item in cart.items:
        product = item.product
        if product is None or not product.is_active:
            raise HTTPException(status_code=409, detail={"code": "product_unavailable", "product_id": str(item.product_id)})
        if product.stock < item.qty:
            raise HTTPException(
                status_code=409,
                detail={"code": "insufficient_stock", "product_id": str(item.product_id), "available": product.stock},
            )

    # 4. Compute totals from LIVE prices — CartItem has no price snapshot
    # by design, so this already reflects the current price.
    subtotal = sum(item.product.price * item.qty for item in cart.items)
    shipping = await _get_shipping_setting(db)
    free_over = shipping.get("free_over", 0)
    shipping_cost = (
        0 if shipping.get("mode") == "free" or (free_over and subtotal >= free_over) else shipping.get("cost", 0)
    )
    total = subtotal + shipping_cost

    # 5. Order number from a dedicated Postgres sequence (see the
    # migration). nextval() advances even if this transaction later rolls
    # back — small numbering gaps from an abandoned checkout are fine, two
    # different orders sharing a number is not.
    seq = (await db.execute(text("SELECT nextval('order_number_seq')"))).scalar_one()
    order_number = f"KMT-{seq}"

    order = Order(
        order_number=order_number,
        user_id=user.id,
        address_id=address.id,
        address_title=address.title,
        address_full_name=address.full_name,
        address_phone=address.phone,
        address_province=address.province,
        address_city=address.city,
        address_line=address.address_line,
        address_postal_code=address.postal_code,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total=total,
        status="pending_payment",
    )
    db.add(order)
    await db.flush()  # need order.id for the OrderItem FK below

    # 6. Snapshot items + decrement stock. The decrement is an atomic
    # conditional UPDATE (WHERE stock >= qty), not a read-then-write on the
    # Product object — step 3's check is only a fast-path; two concurrent
    # checkouts racing for the last unit still can't oversell, because
    # whichever commits second finds rowcount == 0 here and the whole
    # order rolls back.
    for item in cart.items:
        product = item.product
        result = await db.execute(
            update(Product)
            .where(Product.id == product.id, Product.stock >= item.qty)
            .values(stock=Product.stock - item.qty)
        )
        if result.rowcount == 0:
            await db.rollback()
            raise HTTPException(
                status_code=409,
                detail={"code": "insufficient_stock", "product_id": str(product.id), "available": product.stock},
            )
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                unit_price=product.price,
                qty=item.qty,
            )
        )
        await db.delete(item)

    await db.commit()

    reloaded = (
        await db.execute(
            select(Order).where(Order.id == order.id).options(*_ORDER_LOAD_OPTS).execution_options(populate_existing=True)
        )
    ).scalar_one()
    return reloaded


@router.get("/", response_model=OrderListResult)
async def list_orders(
    page: int = 1,
    page_size: int = 20,
    user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Order)
        .where(Order.user_id == user.id)
        .options(*_ORDER_LOAD_OPTS)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(Order).where(Order.user_id == user.id))).scalar_one()
    return OrderListResult(items=items, total=total, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: uuid.UUID, user: User = Depends(get_current_customer), db: AsyncSession = Depends(get_db)
):
    order = (
        await db.execute(select(Order).where(Order.id == order_id).options(*_ORDER_LOAD_OPTS))
    ).scalar_one_or_none()
    if order is None or order.user_id != user.id:  # SECURITY: ownership check
        raise HTTPException(status_code=404, detail="Order not found")
    return order
