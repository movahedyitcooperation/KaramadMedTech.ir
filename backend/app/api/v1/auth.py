from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token, verify_password
from app.models.admin_user import AdminUser
from app.schemas.auth import AdminLoginRequest, AdminLoginResponse

router = APIRouter()

# HTTPBearer, not OAuth2PasswordBearer: the frontend forwards a plain
# `Authorization: Bearer <token>` header from a Route Handler — there is no
# browser-submitted OAuth2 form-urlencoded login here for FastAPI's own
# OAuth2PasswordBearer/tokenUrl machinery to model. HTTPBearer is the
# semantically-correct "extract a bearer token" primitive and keeps /docs
# honest (a bearer-token field, not a fake username/password form).
bearer_scheme = HTTPBearer(auto_error=False)


@router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(AdminUser).where(AdminUser.email == payload.email.lower().strip())
    user = (await db.execute(stmt)).scalar_one_or_none()
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token, expires_in = create_access_token(subject=user.id, role=user.role)
    return AdminLoginResponse(access_token=token, expires_in=expires_in)


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> AdminUser:
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
    if user_id is None or role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")

    user = await db.get(AdminUser, UUID(user_id))
    if user is None or not user.is_active:
        raise unauthorized
    return user
