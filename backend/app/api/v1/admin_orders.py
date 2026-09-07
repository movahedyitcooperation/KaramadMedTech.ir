import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_admin
from app.core.database import get_db
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas.order import AdminOrderListResult, AdminOrderRead, AdminOrderStatusUpdate, OrderRead

# Mounted at /admin/orders — a same-shape path-collision risk with the
# customer-facing /orders/{order_id} doesn't apply here since these routes
# sit two segments under /orders (see admin_products.py's own comment for
# why that matters), but the real reason this is a separate router from
# orders.py is the auth dependency: get_current_admin, not
# get_current_customer, and no ownership check against a `user` — an admin
# is allowed to see every customer's orders.
router = APIRouter(dependencies=[Depends(get_current_admin)])

_LOAD_OPTS = (selectinload(Order.items),)

# Order lifecycle, forward-only except into "cancelled". "pending_payment"
# -> "paid" normally happens automatically via the ZarinPal callback
# (payments.py), but an admin can also mark it paid by hand for an
# out-of-band settlement (card-to-card, COD) — see docs/ROADMAP.md's own
# fallback for when ZarinPal merchant paperwork is delayed. "shipped" ->
# "delivered" is the only transition out of "shipped": a shipped order isn't
# cancellable here, since a real return/refund flow is out of scope for v1.
_ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "pending_payment": {"paid", "cancelled"},
    "paid": {"processing", "cancelled"},
    "processing": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


def _contact(phone: str | None, email: str | None) -> str:
    return phone or email or "—"


def _to_admin_read(order: Order, contact: str) -> AdminOrderRead:
    return AdminOrderRead(
        **OrderRead.model_validate(order).model_dump(),
        user_id=order.user_id,
        contact=contact,
        created_at=order.created_at,
    )


@router.get("/", response_model=AdminOrderListResult)
async def admin_list_orders(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Order)
    if status:
        stmt = stmt.where(Order.status == status)
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = (
        stmt.order_by(Order.created_at.desc())
        .options(*_LOAD_OPTS)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    orders = (await db.execute(stmt)).scalars().all()

    # Bulk-fetch contacts in one query rather than one-per-order — the same
    # N+1 concern CLAUDE.md §5 already calls out for facet counts.
    user_ids = {o.user_id for o in orders}
    contacts: dict[uuid.UUID, str] = {}
    if user_ids:
        rows = (await db.execute(select(User.id, User.phone, User.email).where(User.id.in_(user_ids)))).all()
        contacts = {row.id: _contact(row.phone, row.email) for row in rows}

    items = [_to_admin_read(o, contacts.get(o.user_id, "—")) for o in orders]
    return AdminOrderListResult(items=items, total=total, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=AdminOrderRead)
async def admin_get_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    order = (await db.execute(select(Order).where(Order.id == order_id).options(*_LOAD_OPTS))).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    user = await db.get(User, order.user_id)
    return _to_admin_read(order, _contact(user.phone, user.email) if user else "—")


@router.patch("/{order_id}", response_model=AdminOrderRead)
async def admin_update_order_status(
    order_id: uuid.UUID, payload: AdminOrderStatusUpdate, db: AsyncSession = Depends(get_db)
):
    order = (await db.execute(select(Order).where(Order.id == order_id).options(*_LOAD_OPTS))).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    allowed = _ALLOWED_TRANSITIONS.get(order.status, set())
    if payload.status not in allowed:
        raise HTTPException(
            status_code=409,
            detail={"code": "invalid_status_transition", "from": order.status, "to": payload.status},
        )

    # Cancelling releases the stock this order is holding. orders.py's
    # checkout() decrements stock at order-creation time, not at payment
    # time, so even a still-unpaid order has already reserved its items —
    # cancelling any non-terminal status must restock. Best-effort: a
    # product deleted since the order was placed has order_item.product_id
    # set to NULL (ON DELETE SET NULL) and is silently skipped — there's
    # nothing left to add stock back to.
    if payload.status == "cancelled":
        for item in order.items:
            if item.product_id is not None:
                await db.execute(
                    update(Product).where(Product.id == item.product_id).values(stock=Product.stock + item.qty)
                )

    order.status = payload.status
    await db.commit()

    reloaded = (
        await db.execute(
            select(Order).where(Order.id == order.id).options(*_LOAD_OPTS).execution_options(populate_existing=True)
        )
    ).scalar_one()
    user = await db.get(User, reloaded.user_id)
    return _to_admin_read(reloaded, _contact(user.phone, user.email) if user else "—")
