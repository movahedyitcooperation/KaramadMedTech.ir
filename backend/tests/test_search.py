"""Tests for product search, the is_featured filter and the facet block.

Two layers, because they fail in different ways:

* Pure unit tests over `app.core.search` — the Persian folding rules, which
  are the subtle part and need no database.
* Integration tests over `GET /api/v1/products/` against a real PostgreSQL
  with the seeded catalog. These skip (rather than fail) when no database is
  reachable, so `pytest` still does something useful on a machine that has
  not run `devdb.sh`.

The parity test in the middle is the important one: the normalisation table
is applied twice — once in Python to the query, once in SQL to the column via
`translate()` — and if those two ever disagree, search silently stops matching
rows that clearly should match. That test compares them character for
character against real Persian input.
"""

import asyncio

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text

from app.core.search import (
    MAX_TOKENS,
    NORMALISE_FROM,
    NORMALISE_TO,
    normalise,
    tokenize_query,
)

ZWNJ = "‌"


# --------------------------------------------------------------------------
# Pure normalisation rules
# --------------------------------------------------------------------------


class TestNormalise:
    def test_arabic_yeh_and_kaf_fold_to_persian(self):
        # The single most common real-world variation: content and keyboards
        # that emit the Arabic code points for what Persian writes as ی and ک.
        assert normalise("ويلچر") == normalise("ویلچر")
        assert normalise("پزشكي") == normalise("پزشکی")

    def test_alef_variants_fold_to_bare_alef(self):
        assert normalise("آمپول") == normalise("امپول")
        assert normalise("أحمد") == normalise("احمد")

    def test_teh_marbuta_folds_to_heh(self):
        assert normalise("سرمة") == normalise("سرمه")

    def test_zwnj_becomes_a_space_so_compounds_match_either_way(self):
        assert normalise(f"تب{ZWNJ}سنج") == normalise("تب سنج")

    def test_persian_and_arabic_digits_fold_to_ascii(self):
        assert normalise("۱۲۳۴۵۶۷۸۹۰") == "1234567890"
        assert normalise("٠١٢٣٤٥٦٧٨٩") == "0123456789"

    def test_tatweel_and_harakat_are_dropped(self):
        assert normalise("مـــاسک") == normalise("ماسک")
        assert normalise("مَاسِک") == normalise("ماسک")

    def test_latin_is_lowercased_so_search_is_case_insensitive(self):
        assert normalise("BEURER") == "beurer"

    def test_translate_tables_line_up(self):
        # translate() deletes any character whose index in FROM has no
        # counterpart in TO. That is intentional for the deletion set, but a
        # replacement silently becoming a deletion would be a real bug, so
        # every replaced character must sit inside TO's length.
        assert len(NORMALISE_TO) <= len(NORMALISE_FROM)
        assert len(set(NORMALISE_FROM)) == len(NORMALISE_FROM), "duplicate source char"


class TestTokenizeQuery:
    def test_splits_on_whitespace(self):
        assert tokenize_query("فشارسنج امرن") == [normalise("فشارسنج"), normalise("امرن")]

    def test_a_zwnj_compound_becomes_two_tokens(self):
        # Folding ZWNJ to a space means «تب‌سنج» searches as «تب» AND «سنج»,
        # which still matches the product whichever way the catalog spells it.
        assert tokenize_query(f"تب{ZWNJ}سنج") == ["تب", "سنج"]

    def test_blank_and_punctuation_only_queries_yield_no_tokens(self):
        # Callers treat an empty token list as "no search", so a stray space
        # in the search box must not return zero results.
        assert tokenize_query("   ") == []
        assert tokenize_query("") == []

    def test_token_count_is_capped(self):
        assert len(tokenize_query(" ".join(str(i) for i in range(50)))) == MAX_TOKENS


# --------------------------------------------------------------------------
# Integration — needs a reachable database with the seeded catalog
# --------------------------------------------------------------------------

def _database_reachable() -> bool:
    """Skip rather than fail when there is no database.

    Checked by actually connecting, not by looking for a DATABASE_URL
    environment variable: the app reads its URL from backend/.env through
    pydantic-settings, so the variable is usually absent from the shell even
    when a perfectly good database is running.
    """
    from sqlalchemy import text as sql_text

    from app.core.database import engine

    async def probe() -> bool:
        try:
            async with engine.connect() as conn:
                await conn.execute(sql_text("SELECT 1"))
            return True
        except Exception:
            return False
        finally:
            # This runs in a throwaway event loop that is about to be closed.
            # Any connection left in the shared pool would still be bound to
            # it, and the first real test to check one out would fail with an
            # asyncpg InterfaceError about a different loop. Disposing empties
            # the pool so the test loop opens fresh connections.
            await engine.dispose()

    try:
        return asyncio.run(probe())
    except Exception:
        return False


pytestmark_db = pytest.mark.skipif(
    not _database_reachable(),
    reason="no reachable database — see backend/README.md's devdb.sh section",
)


@pytest_asyncio.fixture
async def client():
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def db():
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        yield session


async def _products(client, **params):
    response = await client.get("/api/v1/products/", params=params)
    assert response.status_code == 200, response.text
    return response.json()


@pytestmark_db
@pytest.mark.asyncio
class TestSearchAgainstDatabase:
    async def test_python_and_sql_normalisation_agree(self, db):
        """The parity check — the whole search rests on these matching."""
        from app.api.v1.products import searchable_expression  # noqa: F401

        samples = [
            "فشارسنج ديجيتال مچي امرن",
            f"تب{ZWNJ}سنج غيرتماسي",
            "ماسک سه‌لايه جراحي (بسته ۵۰ عددي)",
            "KMT-BP-0001",
            "مـ__اسک",
        ]
        for sample in samples:
            sql_result = (
                await db.execute(
                    select(func.lower(func.translate(text(":s"), NORMALISE_FROM, NORMALISE_TO))),
                    {"s": sample},
                )
            ).scalar_one()
            assert sql_result == normalise(sample), f"mismatch for {sample!r}"

    async def test_finds_a_product_by_persian_name(self, client):
        data = await _products(client, q="فشارسنج")
        assert data["total"] >= 1
        assert all("فشارسنج" in p["name"] for p in data["items"])

    async def test_arabic_spelling_finds_the_persian_row(self, client):
        arabic = await _products(client, q="ويلچر")
        persian = await _products(client, q="ویلچر")
        assert arabic["total"] == persian["total"] >= 1

    async def test_tokens_are_anded_and_order_independent(self, client):
        forward = await _products(client, q="فشارسنج امرن")
        reversed_ = await _products(client, q="امرن فشارسنج")
        assert forward["total"] == reversed_["total"] == 1

    async def test_matches_sku(self, client):
        data = await _products(client, q="KMT-BP-0001")
        assert data["total"] == 1
        assert data["items"][0]["sku"] == "KMT-BP-0001"

    async def test_latin_brand_is_case_insensitive(self, client):
        lower = await _products(client, q="beurer")
        upper = await _products(client, q="BEURER")
        assert lower["total"] == upper["total"] >= 1

    async def test_no_match_returns_an_empty_page_not_an_error(self, client):
        data = await _products(client, q="زیرشلواری‌بی‌ربط")
        assert data["total"] == 0
        assert data["items"] == []

    async def test_blank_query_does_not_filter(self, client):
        blank = await _products(client, q="   ")
        unfiltered = await _products(client)
        assert blank["total"] == unfiltered["total"]

    async def test_search_composes_with_category_and_paging(self, client):
        scoped = await _products(client, q="ماسک", category_slug="masrafi-behdashti")
        assert scoped["total"] >= 1
        wrong = await _products(client, q="ماسک", category_slug="tajhizat-tashkhisi")
        assert wrong["total"] == 0

        page1 = await _products(client, q="ت", page_size=2, page=1)
        page2 = await _products(client, q="ت", page_size=2, page=2)
        assert page1["total"] == page2["total"]
        ids1 = {p["id"] for p in page1["items"]}
        ids2 = {p["id"] for p in page2["items"]}
        assert ids1.isdisjoint(ids2), "pages must not overlap"


@pytestmark_db
@pytest.mark.asyncio
class TestIsFeaturedFilter:
    async def test_partitions_the_catalog(self, client):
        featured = await _products(client, is_featured="true")
        rest = await _products(client, is_featured="false")
        everything = await _products(client)
        assert featured["total"] + rest["total"] == everything["total"]
        assert featured["total"] > 0

    async def test_filters_at_the_database_not_the_page(self, client):
        # page_size smaller than the featured count: if the filter were
        # applied after paging, `total` would be the unfiltered count.
        data = await _products(client, is_featured="true", page_size=1)
        assert len(data["items"]) == 1
        assert data["items"][0]["is_featured"] is True
        assert data["total"] > 1

    async def test_omitting_it_returns_both(self, client):
        everything = await _products(client)
        flags = {p["is_featured"] for p in everything["items"]}
        assert flags == {True, False}


@pytestmark_db
@pytest.mark.asyncio
class TestFacets:
    async def test_absent_unless_requested(self, client):
        assert (await _products(client))["facets"] is None

    async def test_counts_match_the_filtered_total(self, client):
        data = await _products(client, category_slug="tajhizat-tashkhisi", include_facets="true")
        facets = data["facets"]
        assert sum(b["count"] for b in facets["brands"]) == data["total"]
        assert sum(s["count"] for s in facets["subcategories"]) == data["total"]

    async def test_a_facet_does_not_narrow_itself(self, client):
        """Picking one brand must still show what the others would give."""
        unfiltered = await _products(client, include_facets="true")
        one_brand = await _products(client, brands=["Omron"], include_facets="true")
        assert one_brand["total"] < unfiltered["total"]
        assert {b["value"] for b in one_brand["facets"]["brands"]} == {
            b["value"] for b in unfiltered["facets"]["brands"]
        }

    async def test_other_filters_do_narrow_a_facet(self, client):
        scoped = await _products(client, category_slug="tajhizat-tashkhisi", include_facets="true")
        unfiltered = await _products(client, include_facets="true")
        assert len(scoped["facets"]["brands"]) < len(unfiltered["facets"]["brands"])

    async def test_subcategories_are_scoped_to_the_department(self, client):
        """Selecting a sub-category still lists its siblings, so the shopper
        can see what switching would give."""
        data = await _products(client, category_slug="fesharsanj", include_facets="true")
        slugs = {s["value"] for s in data["facets"]["subcategories"]}
        assert {"fesharsanj", "pulse-oximeter", "tabsanj"} <= slugs
        assert data["total"] < sum(s["count"] for s in data["facets"]["subcategories"])

    async def test_subcategories_empty_without_a_category(self, client):
        assert (await _products(client, include_facets="true"))["facets"]["subcategories"] == []

    async def test_price_bounds_ignore_their_own_filter(self, client):
        unfiltered = await _products(client, include_facets="true")
        floored = await _products(client, price_min=1_000_000, include_facets="true")
        assert floored["facets"]["price_min"] == unfiltered["facets"]["price_min"]

    async def test_facets_reflect_a_search(self, client):
        data = await _products(client, q="فشارسنج", include_facets="true")
        assert sum(b["count"] for b in data["facets"]["brands"]) == data["total"]
        assert data["total"] < 15
