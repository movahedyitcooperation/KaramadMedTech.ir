# Karamad MedTech — Backend (FastAPI)

Python 3.12 · FastAPI · SQLAlchemy 2.0 (async) · PostgreSQL · Alembic · uv

The FastAPI backend for the Karamad MedTech storefront. Exposes a JSON REST
API at `/api/v1/*` for a separate Next.js frontend to consume.

Live route groups (see `app/api/v1/router.py`):

- **Storefront (read):** `categories`, `products`, `settings`
- **Customer auth & account:** `auth` (admin login + customer SMS-OTP),
  `cart` (persistent server-side cart), `account` (addresses)
- **Admin:** `admin/products`, `admin/categories`, `admin/uploads` CRUD

`orders` and `payments` exist as bare stub routers only and are not wired
into the API yet — see `app/api/v1/{orders,payments}.py`.

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
uv run python scripts/create_admin.py   # create an admin user (interactive)
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
| `JWT_SECRET` | Signing secret for admin and customer JWTs |
| `FRONTEND_ORIGIN` | Single allowed CORS origin for the Next.js frontend (default `http://localhost:3000`) |

See `.env.example` for the full list, including the customer OTP-auth and
SMTP/SMS settings.

## API casing note

This API uses snake_case throughout (`category_slug`, `compare_at_price`,
`hero_slides`, ...). The Next.js frontend's TypeScript types use camelCase
and convert at its own fetch boundary — this backend always speaks
snake_case.

## Storefront read endpoints

- `GET /api/v1/categories` — full tree (top-level + one level of children)
- `GET /api/v1/categories/{slug}`
- `GET /api/v1/products` — `category_slug`, `price_min`, `price_max`,
  `brands` (repeatable), `in_stock_only`, `sort`
  (`newest|cheapest|expensive|rating`), `page`, `page_size`
- `GET /api/v1/products/{slug}`
- `GET /api/v1/settings`

Full request/response contracts for every route group are in the generated
OpenAPI docs at `/docs`.
