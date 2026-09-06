import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * These assert the *request* this module builds, not the backend's answer:
 * that search, is_featured and the facet flag reach the API as real query
 * parameters, and that nothing is filtered, counted or paged in JS on the way
 * back. The backend's own suite (backend/tests/test_search.py) covers what
 * those parameters then do in SQL.
 *
 * `fetch` is stubbed rather than a whole API client mocked, so the URL under
 * test is the exact string that would go over the wire.
 */

const EMPTY_RESPONSE = {
  items: [],
  total: 0,
  page: 1,
  page_size: 12,
  facets: null,
};

let fetchMock: ReturnType<typeof vi.fn>;

/** The URL passed to the most recent fetch, parsed. */
function lastRequest(): URL {
  const calls = fetchMock.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return new URL(calls[calls.length - 1][0] as string);
}

beforeEach(() => {
  vi.resetModules();
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => EMPTY_RESPONSE,
  }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function db() {
  return import("./products");
}

describe("listProducts query building", () => {
  it("sends a trimmed q, leaving the Persian text itself untouched", async () => {
    const { listProducts } = await db();
    await listProducts(null, { q: "  فشارسنج امرن  " });
    // Normalisation is the backend's job: it owns the one table applied to
    // both the query and the indexed column. Folding here too would risk the
    // two drifting apart.
    expect(lastRequest().searchParams.get("q")).toBe("فشارسنج امرن");
  });

  it("omits q entirely for a blank query, so a stray space is not a filter", async () => {
    const { listProducts } = await db();
    await listProducts(null, { q: "   " });
    expect(lastRequest().searchParams.has("q")).toBe(false);
  });

  it("sends is_featured only when it is a boolean", async () => {
    const { listProducts } = await db();

    await listProducts(null, { isFeatured: true });
    expect(lastRequest().searchParams.get("is_featured")).toBe("true");

    await listProducts(null, { isFeatured: false });
    expect(lastRequest().searchParams.get("is_featured")).toBe("false");

    await listProducts(null, {});
    expect(lastRequest().searchParams.has("is_featured")).toBe(false);
  });

  it("asks for facets only when requested", async () => {
    const { listProducts } = await db();

    await listProducts(null, {});
    expect(lastRequest().searchParams.has("include_facets")).toBe(false);

    await listProducts(null, { includeFacets: true });
    expect(lastRequest().searchParams.get("include_facets")).toBe("true");
  });

  it("repeats the brands param rather than joining it", async () => {
    const { listProducts } = await db();
    await listProducts(null, { brands: ["Omron", "Beurer"] });
    expect(lastRequest().searchParams.getAll("brands")).toEqual(["Omron", "Beurer"]);
  });

  it("passes every filter through as a server-side query param", async () => {
    const { listProducts } = await db();
    await listProducts("tajhizat-tashkhisi", {
      q: "فشارسنج",
      priceMin: 100_000,
      priceMax: 900_000,
      inStockOnly: true,
      sort: "cheapest",
      page: 3,
      pageSize: 9,
    });
    const params = lastRequest().searchParams;
    expect(Object.fromEntries(params)).toMatchObject({
      q: "فشارسنج",
      category_slug: "tajhizat-tashkhisi",
      price_min: "100000",
      price_max: "900000",
      in_stock_only: "true",
      sort: "cheapest",
      page: "3",
      page_size: "9",
    });
  });

  it("clamps page_size to the backend's own maximum", async () => {
    const { listProducts } = await db();
    await listProducts(null, { pageSize: 5000 });
    expect(lastRequest().searchParams.get("page_size")).toBe("100");
  });
});

describe("getFeaturedProducts", () => {
  it("filters at the database and asks for exactly the rows it needs", async () => {
    const { getFeaturedProducts } = await db();
    await getFeaturedProducts(8);
    const params = lastRequest().searchParams;
    // The regression this guards: it used to request page_size=100 and then
    // drop the non-featured ones in JS.
    expect(params.get("is_featured")).toBe("true");
    expect(params.get("page_size")).toBe("8");
  });
});

describe("searchProducts", () => {
  it("issues one request carrying both the query and the filters", async () => {
    const { searchProducts } = await db();
    await searchProducts("ماسک", { inStockOnly: true, page: 2, includeFacets: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const params = lastRequest().searchParams;
    expect(params.get("q")).toBe("ماسک");
    expect(params.get("in_stock_only")).toBe("true");
    expect(params.get("page")).toBe("2");
    expect(params.get("include_facets")).toBe("true");
  });
});

describe("facet mapping", () => {
  it("labels a brand with its own value and a category with its name", async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        ...EMPTY_RESPONSE,
        facets: {
          brands: [{ value: "Omron", label: null, count: 2 }],
          categories: [
            { value: "tajhizat-tashkhisi", label: "تجهیزات تشخیصی", count: 4 },
          ],
          subcategories: [{ value: "fesharsanj", label: "فشارسنج", count: 2 }],
          in_stock: 14,
          price_min: 95000,
          price_max: 24500000,
        },
      }),
    }));

    const { listProducts } = await db();
    const result = await listProducts(null, { includeFacets: true });

    expect(result.facets).toEqual({
      brands: [{ value: "Omron", label: "Omron", count: 2 }],
      categories: [{ value: "tajhizat-tashkhisi", label: "تجهیزات تشخیصی", count: 4 }],
      subcategories: [{ value: "fesharsanj", label: "فشارسنج", count: 2 }],
      inStock: 14,
      priceMin: 95000,
      priceMax: 24500000,
    });
  });

  it("is null when the backend did not send a facet block", async () => {
    const { listProducts } = await db();
    expect((await listProducts(null, {})).facets).toBeNull();
  });
});
