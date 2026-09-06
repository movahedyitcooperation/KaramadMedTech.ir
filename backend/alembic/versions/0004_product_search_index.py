"""product search: pg_trgm extension + GIN index on the normalised haystack

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-06

Hand-authored, same convention as 0001-0003.

Why a trigram index and not tsvector: Postgres ships no Persian text-search
configuration, so `to_tsvector('persian', ...)` is not available and
`'simple'` would give us tokenisation without stemming — no better than
substring matching, and worse at partial words, which is exactly what a
shopper typing «فشارس» into a search box produces. `pg_trgm` + GIN indexes
substrings directly and accelerates the `LIKE '%…%'` the API issues.

The indexed expression must match `app/api/v1/products.py`'s
`searchable_expression()` character for character, or Postgres will silently
fall back to a sequential scan. Both sides derive their `translate()`
arguments from `app/core/search.py`; this migration inlines the resulting
literals because a migration must stay pinned to the schema as it was at this
revision, not follow a constant that may later change. If that table ever
changes, add a NEW migration that drops and recreates this index — do not edit
this one.
"""

from typing import Sequence, Union

from alembic import op

from app.core.search import NORMALISE_FROM, NORMALISE_TO

# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "ix_products_search_trgm"


def _searchable_sql() -> str:
    # Doubling single quotes is the SQL literal escape; the normalisation
    # tables are ASCII punctuation-free Persian/Arabic characters, so this is
    # the only escaping needed.
    src = NORMALISE_FROM.replace("'", "''")
    dst = NORMALISE_TO.replace("'", "''")
    return (
        "lower(translate("
        "coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || "
        "coalesce(short_desc, '') || ' ' || coalesce(sku, '')"
        f", '{src}', '{dst}'))"
    )


def upgrade() -> None:
    # pg_trgm ships with core Postgres as a contrib module (Debian/Ubuntu:
    # `postgresql-contrib`), but it is not universally present — the
    # pip-bundled server that backend/devdb.sh runs for local development
    # carries no contrib modules at all.
    #
    # The index is a pure performance optimisation: search is correct without
    # it, Postgres just falls back to a sequential scan. So a missing
    # extension degrades rather than failing the migration and blocking every
    # later one. Deployment checks for the index — see docs/DEPLOY.md.
    available = op.get_bind().exec_driver_sql(
        "SELECT 1 FROM pg_available_extensions WHERE name = 'pg_trgm'"
    ).scalar()
    if not available:
        print(
            "[0004] pg_trgm is not available on this server — skipping "
            f"{INDEX_NAME}. Product search still works; it will do a "
            "sequential scan. Install postgresql-contrib and re-run this "
            "migration to add the index."
        )
        return

    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(
        f"CREATE INDEX IF NOT EXISTS {INDEX_NAME} ON products "
        f"USING gin (({_searchable_sql()}) gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {INDEX_NAME}")
    # The extension is deliberately left in place: dropping it would break any
    # other index that came to depend on it, and it is harmless on its own.
