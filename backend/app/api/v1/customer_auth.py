import re
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.email import get_email_provider
from app.core.security import create_access_token, decode_access_token, hash_otp_code, verify_otp_code
from app.core.sms import get_sms_provider
from app.models.cart_item import CartItem
from app.models.cart_session import CartSession
from app.models.otp_code import OtpCode
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemRead, CartRead
from app.schemas.customer_auth import RequestOtpRequest, RequestOtpResponse, VerifyOtpRequest, VerifyOtpResponse

router = APIRouter()

# Separate HTTPBearer instance from admin's (app/api/v1/auth.py) — same
# rationale as that one: the frontend forwards a plain `Authorization:
# Bearer <token>` header from a Server Action, no OAuth2 form login exists.
bearer_scheme = HTTPBearer(auto_error=False)

PHONE_RE = re.compile(r"^09\d{9}$")
# Deliberately a plain regex, not pydantic.EmailStr — same reasoning as
# AdminLoginRequest (schemas/auth.py): EmailStr needs the email-validator
# package, a dependency not currently listed.
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

_CART_LOAD_OPTS = (selectinload(CartSession.items).selectinload(CartItem.product).selectinload(Product.images),)


def classify_contact(raw: str) -> tuple[str, str]:
    """Mirrors the frontend's own contact validation exactly. Returns
    (channel, normalized). Raises a structured 422 on neither shape."""
    contact = raw.strip()
    if PHONE_RE.match(contact):
        return "phone", contact
    normalized = contact.lower()
    if EMAIL_RE.match(normalized):
        return "email", normalized
    raise HTTPException(status_code=422, detail={"code": "invalid_contact"})


async def _enforce_rate_limits(db: AsyncSession, contact: str, ip: str | None) -> None:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=1)

    contact_count = (
        await db.execute(
            select(func.count())
            .select_from(OtpCode)
            .where(OtpCode.contact == contact, OtpCode.created_at >= window_start)
        )
    ).scalar_one()
    if contact_count >= settings.OTP_MAX_REQUESTS_PER_CONTACT_PER_HOUR:
        raise HTTPException(status_code=429, detail={"code": "otp_rate_limited_contact"})

    if ip:
        ip_count = (
            await db.execute(
                select(func.count())
                .select_from(OtpCode)
                .where(OtpCode.request_ip == ip, OtpCode.created_at >= window_start)
            )
        ).scalar_one()
        if ip_count >= settings.OTP_MAX_REQUESTS_PER_IP_PER_HOUR:
            raise HTTPException(status_code=429, detail={"code": "otp_rate_limited_ip"})

    latest = (
        await db.execute(
            select(OtpCode).where(OtpCode.contact == contact).order_by(OtpCode.created_at.desc()).limit(1)
        )
    ).scalar_one_or_none()
    if latest:
        elapsed = (now - latest.created_at).total_seconds()
        if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
            raise HTTPException(
                status_code=429,
                detail={
                    "code": "otp_resend_too_soon",
                    "retry_after_seconds": int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed),
                },
            )


@router.post("/customer/request-otp", response_model=RequestOtpResponse)
async def request_otp(payload: RequestOtpRequest, request: Request, db: AsyncSession = Depends(get_db)):
    channel, contact = classify_contact(payload.contact)
    client_ip = request.client.host if request.client else None
    await _enforce_rate_limits(db, contact, client_ip)

    code = f"{secrets.randbelow(1_000_000):06d}"  # secrets, not random — cryptographic quality
    otp = OtpCode(
        contact=contact,
        channel=channel,
        code_hash=hash_otp_code(code),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=settings.OTP_TTL_SECONDS),
        request_ip=client_ip,
    )
    db.add(otp)
    await db.commit()

    try:
        if channel == "phone":
            await get_sms_provider().send(contact, code)
        else:
            await get_email_provider().send(contact, code)
    except Exception:
        # The OtpCode row stays committed (still counts toward rate limits —
        # prevents retry storms even when delivery itself is failing). The
        # raw code is never included in this error response.
        raise HTTPException(status_code=502, detail={"code": "otp_delivery_failed"})

    return RequestOtpResponse(contact=contact, channel=channel, expires_in=settings.OTP_TTL_SECONDS)


async def _get_user_cart(db: AsyncSession, user_id: UUID) -> CartSession:
    """Fetches the user's CartSession, lazily creating an empty one if none
    exists yet — mirrors cart.py's get_cart_owner lazy-creation, so verify-otp
    never has to fabricate a placeholder id for its response.

    Called after _merge_guest_cart_into_user's commit — populate_existing
    forces a genuine re-fetch rather than handing back a pre-merge cached
    `items` collection from this request's identity map (same
    expire_on_commit=False gotcha as cart.py's _reload). Deliberately NOT
    db.expire_all()/db.expire(): either would also mark the already-loaded
    `user` object (used later for create_access_token(subject=user.id, ...))
    as expired, and a later synchronous attribute access on an expired
    object outside an explicit await raises SQLAlchemy's MissingGreenlet on
    an async engine — this bit us here once already."""
    cart = (
        await db.execute(
            select(CartSession)
            .where(CartSession.user_id == user_id)
            .options(*_CART_LOAD_OPTS)
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()
    if cart is not None:
        return cart
    cart = CartSession(user_id=user_id)
    db.add(cart)
    await db.commit()
    return (
        await db.execute(select(CartSession).where(CartSession.id == cart.id).options(*_CART_LOAD_OPTS))
    ).scalar_one()


async def _merge_guest_cart_into_user(db: AsyncSession, user: User, guest_token: str | None) -> None:
    if not guest_token:
        return
    guest_cart = (
        await db.execute(select(CartSession).where(CartSession.guest_token == guest_token).options(*_CART_LOAD_OPTS))
    ).scalar_one_or_none()
    if guest_cart is None:
        return  # guest never added anything under this token

    user_cart = (
        await db.execute(select(CartSession).where(CartSession.user_id == user.id).options(*_CART_LOAD_OPTS))
    ).scalar_one_or_none()

    if user_cart is None:
        # No prior account cart — the guest cart itself becomes the account cart.
        guest_cart.user_id = user.id
        guest_cart.guest_token = None
        await db.commit()
        return

    # Both exist: sum quantities for shared products (clamped to current
    # stock), copy over the rest, then discard the guest cart (cascade
    # deletes its CartItem rows).
    user_items_by_product = {ci.product_id: ci for ci in user_cart.items}
    for gi in guest_cart.items:
        existing = user_items_by_product.get(gi.product_id)
        if existing is not None:
            existing.qty = min(existing.qty + gi.qty, gi.product.stock)
        else:
            db.add(CartItem(cart_id=user_cart.id, product_id=gi.product_id, qty=min(gi.qty, gi.product.stock)))
    await db.delete(guest_cart)
    await db.commit()


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


@router.post("/customer/verify-otp", response_model=VerifyOtpResponse)
async def verify_otp(payload: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    channel, contact = classify_contact(payload.contact)

    otp = (
        await db.execute(
            select(OtpCode)
            .where(OtpCode.contact == contact, OtpCode.consumed_at.is_(None))
            .order_by(OtpCode.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if otp is None:
        raise HTTPException(status_code=401, detail={"code": "otp_not_found"})
    if otp.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail={"code": "otp_expired"})
    if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=401, detail={"code": "otp_max_attempts"})

    if not verify_otp_code(payload.code, otp.code_hash):
        otp.attempts += 1
        await db.commit()
        raise HTTPException(
            status_code=401,
            detail={"code": "otp_invalid_code", "attempts_left": settings.OTP_MAX_ATTEMPTS - otp.attempts},
        )

    otp.consumed_at = datetime.now(timezone.utc)

    filter_col = User.phone if channel == "phone" else User.email
    user = (await db.execute(select(User).where(filter_col == contact))).scalar_one_or_none()
    if user is None:
        user = User(phone=contact if channel == "phone" else None, email=contact if channel == "email" else None)
        db.add(user)
        await db.flush()  # need user.id before the merge/cart-fetch below

    await db.commit()  # persists otp.consumed_at + any new user row

    await _merge_guest_cart_into_user(db, user, payload.guest_cart_token)
    cart = await _get_user_cart(db, user.id)

    token, expires_in = create_access_token(
        subject=user.id, role="CUSTOMER", expires_minutes=settings.CUSTOMER_JWT_EXPIRE_DAYS * 24 * 60
    )
    return VerifyOtpResponse(
        access_token=token, expires_in=expires_in, contact=contact, cart=_to_cart_read(cart)
    )


async def get_current_customer(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"}
    )
    if credentials is None:
        raise unauthorized
    try:
        claims = decode_access_token(credentials.credentials)
    except JWTError:
        raise unauthorized
    user_id, role = claims.get("sub"), claims.get("role")
    if user_id is None or role != "CUSTOMER":
        raise HTTPException(status_code=403, detail="Customer access required")
    user = await db.get(User, UUID(user_id))
    if user is None or not user.is_active:
        raise unauthorized
    return user
