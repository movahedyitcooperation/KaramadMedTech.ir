# Karamad MedTech — Backend (FastAPI)

Python 3.12 · FastAPI · SQLAlchemy 2.0 (async) · PostgreSQL · Alembic · uv

Serves the Next.js storefront (in the parent directory of this repo) over a
JSON REST API at `/api/v1/*`. Currently read-only: categories, products,
settings. Auth, cart, orders, and payments are stub routers only — see
`app/api/v1/{auth,cart,orders,payments}.py`.

## Prerequisites

- [`uv`](https://docs.astral.sh/uv/) installed and on PATH. This project
  manages its own Python 3.12 via uv (`.python-version` pins it) — no
  system-wide Python 3.12 install is required.
- A reachable PostgreSQL 15+ instance for anything beyond `uv sync` or
  running the dev server without hitting the database.

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
