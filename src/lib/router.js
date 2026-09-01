/* router.js — hash router. Works on any static host, no server rewrites.
   All catalog filter state lives in the query string (master prompt §2, §11).

     #/                         home
     #/c/<cat>[/<sub>]?...      category   (sort, price_min, price_max, brands, in_stock, page)
     #/p/<slug>                 product
     #/cart                     cart
     #/login                    login
     #/account[/<tab>]          account    (tab: profile | addresses | orders)
*/

let onChange = () => {};

export function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, queryStr] = raw.split("?");
  const seg = path.split("/").filter(Boolean); // ["c","diagnostics","bp"]
  const q = new URLSearchParams(queryStr || "");

  const base = {
    route: "home",
    catSlug: null, subSlug: null, productSlug: null, acctTab: "profile",
    sort: "newest", priceMin: "", priceMax: "", brands: [], inStockOnly: false, page: 1,
  };

  if (seg[0] === "c") {
    base.route = "category";
    base.catSlug = seg[1] || null;
    base.subSlug = seg[2] || null;
    base.sort = q.get("sort") || "newest";
    base.priceMin = q.get("price_min") || "";
    base.priceMax = q.get("price_max") || "";
    base.brands = (q.get("brands") || "").split(",").map((s) => s.trim()).filter(Boolean);
    base.inStockOnly = q.get("in_stock") === "1";
    base.page = Math.max(1, parseInt(q.get("page") || "1", 10) || 1);
  } else if (seg[0] === "p") {
    base.route = "product";
    base.productSlug = seg[1] || null;
  } else if (seg[0] === "cart") {
    base.route = "cart";
  } else if (seg[0] === "login") {
    base.route = "login";
  } else if (seg[0] === "account") {
    base.route = "account";
    base.acctTab = seg[1] || "profile";
  }
  return base;
}

/** Build a hash string from a partial route object (used by navigate helpers). */
export function buildHash(r) {
  let path = "/";
  const q = new URLSearchParams();
  if (r.route === "category") {
    path = "/c/" + r.catSlug + (r.subSlug ? "/" + r.subSlug : "");
    if (r.sort && r.sort !== "newest") q.set("sort", r.sort);
    if (r.priceMin) q.set("price_min", r.priceMin);
    if (r.priceMax) q.set("price_max", r.priceMax);
    if (r.brands && r.brands.length) q.set("brands", r.brands.join(","));
    if (r.inStockOnly) q.set("in_stock", "1");
    if (r.page && r.page > 1) q.set("page", String(r.page));
  } else if (r.route === "product") {
    path = "/p/" + r.productSlug;
  } else if (r.route === "cart") {
    path = "/cart";
  } else if (r.route === "login") {
    path = "/login";
  } else if (r.route === "account") {
    path = "/account" + (r.acctTab && r.acctTab !== "profile" ? "/" + r.acctTab : "");
  }
  const qs = q.toString();
  return "#" + path + (qs ? "?" + qs : "");
}

let lastPath = "";
export function navigate(hashOrRoute, { replace = false } = {}) {
  const hash = typeof hashOrRoute === "string" ? hashOrRoute : buildHash(hashOrRoute);
  if (("#" + location.hash.replace(/^#/, "")) === hash) { onChange(parseHash()); return; }
  if (replace) history.replaceState(null, "", hash);
  else location.hash = hash;
  if (replace) onChange(parseHash());
}

export function startRouter(cb) {
  onChange = cb;
  window.addEventListener("hashchange", () => {
    const parsed = parseHash();
    const path = location.hash.split("?")[0];
    if (path !== lastPath) { lastPath = path; window.scrollTo(0, 0); }
    onChange(parsed);
  });
  lastPath = location.hash.split("?")[0];
  onChange(parseHash());
}
