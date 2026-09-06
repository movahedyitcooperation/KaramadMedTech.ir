# Karamad MedTech — Backend (FastAPI)

Python 3.12 · FastAPI · SQLAlchemy 2.0 (async) · PostgreSQL · Alembic · uv

Serves the Next.js storefront (the parent directory of this one) over a JSON
REST API at `/api/v1/*`.

Live and registered on `api_router`: categories, products, settings, admin
auth + product/category CRUD + uploads, customer OTP auth, cart (guest and
authenticated), and account (profile + addresses). **Orders and payments are
Phase 6 stubs** — `app/api/v1/{orders,payments}.py` exist as bare
`APIRouter()`s and are deliberately *not* included in `router.py`. See
`../docs/BACKEND-GAPS.md` for what the storefront does instead, and what each
missing capability costs to build.

## Prerequisites

- [`uv`](https://docs.astral.sh/uv/) installed and on PATH. This project
  manages its own Python 3.12 via uv (`.python-version` pins it) — no
  system-wide Python 3.12 install is required.
- A reachable PostgreSQL 15+ instance for anything beyond `uv sync` or
  running the dev server without hitting the database.

### No PostgreSQL installed?

`devdb.sh` runs the PostgreSQL binaries bundled inside the `pgserver` pip
package on a fixed local port, so the real stack — real Alembic migrations,
real `JSONB`/`UUID` columns, the real seed script — can be exercised without
installing a server:

```bash
pip install pgserver         # into the same venv as the app's deps
./devdb.sh init              # once: initdb into ./.pgdata (gitignored)
./devdb.sh start             # listens on 127.0.0.1:55432
./devdb.sh status            # pg_isready
./devdb.sh stop
```

Then point `DATABASE_URL` at it:
`postgresql+asyncpg://postgres@127.0.0.1:55432/karamad_medtech`
(create the database once with the bundled `psql`). Development only — the
deployed stack uses a real PostgreSQL instance, see `../docs/DEPLOY.md`.

## Setup

```bash
cp .env.example .env        # fill in DATABASE_URL / JWT_SECRET
uv sync                     # provisions Python 3.12 (if missing) + installs deps
uv run alembic upgrade head # apply migrations — only once DATABASE_URL is reachable
uv run python scripts/seed.py   # idempotent — safe to re-run any time
```

## Run the dev server

```bash
uv run uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Tests

```bash
uv run pytest            # or ./.venv/Scripts/python -m pytest
```

`tests/test_search.py` covers the Persian normalisation rules as pure unit
tests, plus integration tests for search, `is_featured` and the facet block
against a real database. The DB-backed tests **skip** (they do not fail) when
no database is reachable, so the suite is still useful on a machine that has
not run `devdb.sh`.

## Project layout

```
app/
  main.py         FastAPI app, CORS, router include
  core/           settings (pydantic-settings) + async DB engine/session
  models/         SQLAlchemy ORM models (one file per domain)
  schemas/        Pydantic request/response schemas
  api/v1/         versioned route modules
alembic/          async migrations (initial migration is hand-authored — see
                  alembic/versions/0001_initial_schema.py)
scripts/seed.py   idempotent catalog/settings seed script
```

## Environment variables

See `.env.example`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` connection string |
| `JWT_SECRET` | Signing secret for future JWT auth (Phase 5 — not used yet) |
| `FRONTEND_ORIGIN` | Single allowed CORS origin for the Next.js frontend (default `http://localhost:3000`) |

## API casing note

This API uses snake_case throughout (`category_slug`, `compare_at_price`,
`hero_slides`, ...), while the Next.js frontend's TypeScript types use
camelCase. A later integration phase — when the frontend replaces its
`lib/db/*.ts` mocks with real calls to this API — will need a thin
camelCase adapter at the fetch boundary; that adapter doesn't exist yet.

## Read-only endpoints (current)

- `GET /api/v1/categories` — full tree (top-level + one level of children)
- `GET /api/v1/categories/{slug}`
- `GET /api/v1/products` — `category_slug`, `price_min`, `price_max`,
  `brands` (repeatable), `in_stock_only`, `sort`
  (`newest|cheapest|expensive|rating`), `page`, `page_size`
- `GET /api/v1/products/{slug}`
- `GET /api/v1/settings`
