import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * These assert the requests this module sends and the shape it hands back —
 * not the backend's behaviour, which its own suite covers.
 *
 * What matters here is the part a frontend can get wrong on its own: that the
 * customer's bearer token is attached (an order call with a guest header would
 * 401), that order creation posts nothing but an address id (totals are the
 * backend's to compute), that a 404 on one order becomes `null` rather than a
 * thrown error, and that the flat `address_*` wire fields are regrouped
 * losslessly.
 *
 * `server-only` is stubbed because Vitest runs the source directly, with no
 * Next.js compiler to strip that import.
 */

vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({
  getCustomerToken: async () => "TOKEN-123",
}));

const ORDER = {
  id: "11111111-1111-1111-1111-111111111111",
  order_number: "KM-1042",
  address_title: "مطب",
  address_full_name: "دکتر رضایی",
  address_phone: "09123456789",
  address_province: "تهران",
  address_city: "تهران",
  address_line: "خیابان ولیعصر، پلاک ۱۲",
  address_postal_code: "1234567890",
  subtotal: 480000,
  shipping_cost: 45000,
  total: 525000,
  status: "pending_payment",
  items: [
    {
      product_id: "22222222-2222-2222-2222-222222222222",
      product_name: "فشارسنج بازویی امرن",
      product_sku: "OMR-M3",
      unit_price: 240000,
      qty: 2,
    },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

function respond(status: number, body: unknown) {
  fetchMock.mockImplementationOnce(async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  }));
}

function lastCall() {
  const calls = fetchMock.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  const [url, init] = calls[calls.length - 1] as [string, RequestInit];
  return { url: new URL(url), init, headers: init.headers as Record<string, string> };
}

beforeEach(() => {
  vi.resetModules();
  fetchMock = vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify(ORDER) }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function db() {
  return import("./orders");
}

describe("createOrder", () => {
  it("posts only the address id — the backend recomputes every total", async () => {
    const { createOrder } = await db();
    await createOrder("addr-1");
    const { url, init } = lastCall();
    expect(init.method).toBe("POST");
    // Trailing slash: the backend mounts a bare "/" route and would 307 without it.
    expect(url.pathname.endsWith("/orders/")).toBe(true);
    expect(JSON.parse(init.body as string)).toEqual({ address_id: "addr-1" });
  });

  it("authenticates as the customer, never as a guest cart", async () => {
    const { createOrder } = await db();
    await createOrder("addr-1");
    const { headers } = lastCall();
    expect(headers.Authorization).toBe("Bearer TOKEN-123");
    expect(headers["X-Guest-Cart-Token"]).toBeUndefined();
  });

  it("regroups the flat address_* wire fields without losing any", async () => {
    const { createOrder } = await db();
    const order = await createOrder("addr-1");
    expect(order.address).toEqual({
      title: "مطب",
      fullName: "دکتر رضایی",
      phone: "09123456789",
      province: "تهران",
      city: "تهران",
      line: "خیابان ولیعصر، پلاک ۱۲",
      postalCode: "1234567890",
    });
    expect(order.orderNumber).toBe("KM-1042");
    expect(order.items[0]).toEqual({
      productId: "22222222-2222-2222-2222-222222222222",
      productName: "فشارسنج بازویی امرن",
      productSku: "OMR-M3",
      unitPrice: 240000,
      qty: 2,
    });
  });

  it("surfaces the backend error code so the UI can translate it", async () => {
    const { createOrder } = await db();
    respond(409, { detail: { code: "insufficient_stock", available: 1 } });
    await expect(createOrder("addr-1")).rejects.toMatchObject({
      status: 409,
      code: "insufficient_stock",
    });
  });
});

describe("requestPayment", () => {
  it("posts the order id and returns the gateway URL unchanged", async () => {
    const { requestPayment } = await db();
    respond(200, { payment_url: "https://www.zarinpal.com/pg/StartPay/A0000001" });
    const url = await requestPayment("order-1");
    expect(url).toBe("https://www.zarinpal.com/pg/StartPay/A0000001");
    const call = lastCall();
    expect(call.init.method).toBe("POST");
    expect(call.url.pathname.endsWith("/payments/request")).toBe(true);
    expect(JSON.parse(call.init.body as string)).toEqual({ order_id: "order-1" });
  });
});

describe("getOrder", () => {
  it("returns null on 404 — an order that is missing or someone else's reads the same", async () => {
    const { getOrder } = await db();
    respond(404, { detail: "Order not found" });
    expect(await getOrder("nope")).toBeNull();
  });

  it("still throws on any other failure, rather than hiding it as an empty page", async () => {
    const { getOrder } = await db();
    respond(500, { detail: "boom" });
    await expect(getOrder("order-1")).rejects.toMatchObject({ status: 500 });
  });

  it("escapes the id into the path", async () => {
    const { getOrder } = await db();
    await getOrder("a b/c");
    expect(lastCall().url.pathname.endsWith("/orders/a%20b%2Fc")).toBe(true);
  });
});

describe("getOrders", () => {
  it("pages through the API rather than slicing a full list client-side", async () => {
    const { getOrders } = await db();
    respond(200, { items: [ORDER], total: 31, page: 2, page_size: 20 });
    const result = await getOrders(2, 20);
    const { url } = lastCall();
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("page_size")).toBe("20");
    expect(result.total).toBe(31);
    expect(result.items).toHaveLength(1);
  });
});
