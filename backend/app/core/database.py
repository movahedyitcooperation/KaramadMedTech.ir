from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# `Base` (the declarative base) deliberately does NOT live in this module — it
# lives in app/models/base.py — to avoid a circular import between core and
# models (models need the engine/session helpers here, and here would need
# Base from models).
# pool_pre_ping issues a cheap liveness check before handing out a pooled
# connection, and transparently replaces it if the check fails. Without it the
# first request after an idle period can die with asyncpg's "connection is
# closed" — anything that severs an idle socket does it: a Postgres restart, a
# `client_idle_timeout`, an NAT/firewall idle reaper on the VPS, or the host
# suspending. Observed in development after the service sat idle; on a
# self-hosted box it would surface as a 500 for the first visitor of the day.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    # Retire connections well inside the usual 5-15 minute idle reaper window
    # rather than waiting for one to be found dead.
    pool_recycle=300,
)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a request-scoped async session."""
    async with AsyncSessionLocal() as session:
        yield session
