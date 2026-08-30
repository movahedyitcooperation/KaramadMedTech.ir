"""CLI to bootstrap the first (or an additional) admin user — no self-service
admin registration exists. Re-running with an existing email resets its
password instead of failing, so this doubles as a password-reset tool.

Usage:
    uv run python scripts/create_admin.py --email you@example.com --password 'xxx'
    uv run python scripts/create_admin.py   # prompts interactively instead
"""

import argparse
import asyncio
import getpass
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))  # same shim as seed.py

from sqlalchemy import select  # noqa: E402

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models.admin_user import AdminUser  # noqa: E402


async def create_or_update_admin(email: str, password: str) -> None:
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(AdminUser).where(AdminUser.email == email))).scalar_one_or_none()
        if existing:
            existing.password_hash = hash_password(password)
            existing.is_active = True
            print(f"Updated existing admin user: {email}")
        else:
            db.add(AdminUser(email=email, password_hash=hash_password(password), role="ADMIN"))
            print(f"Created admin user: {email}")
        await db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or reset an admin user")
    parser.add_argument("--email")
    parser.add_argument("--password")
    args = parser.parse_args()

    email = (args.email or input("Admin email: ")).strip().lower()
    password = args.password or getpass.getpass("Admin password: ")
    if not email or not password:
        print("Email and password are required.", file=sys.stderr)
        sys.exit(1)
    if len(password) < 8:
        print("Password must be at least 8 characters.", file=sys.stderr)
        sys.exit(1)

    asyncio.run(create_or_update_admin(email, password))


if __name__ == "__main__":
    main()
