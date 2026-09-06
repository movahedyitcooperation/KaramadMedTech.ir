"""Shared test fixtures.

`app.core.database.engine` is created once at import time and holds a
connection pool. pytest-asyncio gives each test function its own event loop,
and an asyncpg connection is bound to the loop that opened it — so a
connection pooled by test A blows up with "attached to a different loop" the
moment test B checks it out. Disposing the pool after every test costs one
reconnect per test (negligible against a loopback database) and removes the
whole class of failure.
"""

import pytest_asyncio


@pytest_asyncio.fixture(autouse=True)
async def _dispose_engine_between_tests():
    yield
    from app.core.database import engine

    await engine.dispose()
