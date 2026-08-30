from __future__ import annotations

from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    # Plain str, not pydantic.EmailStr — EmailStr needs the email-validator
    # package, a new dependency not currently listed. Per CLAUDE.md ("do not
    # add dependencies not listed here without asking"), skip it — an
    # invalid email just fails the lookup and returns 401 either way.
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
