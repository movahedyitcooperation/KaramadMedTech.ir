from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.customer_auth import get_current_customer
from app.core.config import settings
from app.core.database import get_db
from app.core.payment import PaymentProviderError, get_payment_provider
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentRequestBody, PaymentRequestResponse

router = APIRouter()


@router.post("/request", response_model=PaymentRequestResponse)
async def request_payment(
    payload: PaymentRequestBody, user: User = Depends(get_current_customer), db: AsyncSession = Depends(get_db)
):
    order = await db.get(Order, payload.order_id)
    if order is None or order.user_id != user.id:  # SECURITY: ownership check
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "pending_payment":
        raise HTTPException(status_code=409, detail={"code": "order_not_payable", "status": order.status})

    provider = get_payment_provider()
    try:
        result = await provider.request_payment(
            amount=order.total, order_number=order.order_number, description=f"سفارش {order.order_number}"
        )
    except PaymentProviderError:
        raise HTTPException(status_code=502, detail={"code": "payment_request_failed"})

    db.add(
        Payment(
            order_id=order.id,
            provider=settings.PAYMENT_PROVIDER,
            authority=result.authority,
            amount=order.total,
            status="pending",
        )
    )
    await db.commit()
    return PaymentRequestResponse(payment_url=result.payment_url)


@router.get("/callback")
async def payment_callback(Authority: str = Query(...), Status: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Public — ZarinPal calls this directly (no customer bearer token).
    Server-side verification happens here, before the frontend ever sees a
    result; the frontend only ever learns the outcome via the redirect's
    query string, matching CLAUDE.md §6's "verify the callback server-side
    before marking an order paid" rule."""
    payment = (await db.execute(select(Payment).where(Payment.authority == Authority))).scalar_one_or_none()
    if payment is None:
        return RedirectResponse(f"{settings.FRONTEND_ORIGIN}/cart?payment=not_found")

    order = await db.get(Order, payment.order_id)

    if Status != "OK":
        payment.status = "failed"
        await db.commit()
        return RedirectResponse(f"{settings.FRONTEND_ORIGIN}/orders/{order.id}?payment=cancelled")

    # Idempotency guard: if this payment was already verified (e.g. the
    # customer refreshes the callback URL, or ZarinPal calls back twice),
    # don't re-verify or re-mark the order paid a second time — just
    # redirect to the same success page. ZarinPal's own code=101
    # ("already verified") inside verify_payment is a second, provider-side
    # idempotency signal on top of this one.
    if payment.status == "verified":
        return RedirectResponse(f"{settings.FRONTEND_ORIGIN}/orders/{order.id}?payment=success")

    provider = get_payment_provider()
    result = await provider.verify_payment(authority=Authority, amount=payment.amount)
    if not result.verified:
        payment.status = "failed"
        await db.commit()
        return RedirectResponse(f"{settings.FRONTEND_ORIGIN}/orders/{order.id}?payment=failed")

    payment.status = "verified"
    payment.ref_id = result.ref_id
    payment.verified_at = datetime.now(timezone.utc)
    order.status = "paid"
    await db.commit()
    return RedirectResponse(f"{settings.FRONTEND_ORIGIN}/orders/{order.id}?payment=success")
