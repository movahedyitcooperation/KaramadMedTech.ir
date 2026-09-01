/* category.js — breadcrumb, sort, sidebar filters, responsive grid, pagination,
   skeleton / empty / error states, mobile filter bottom-sheet.
   Ports lines 397–553 of the prototype. All filter state comes from the URL. */

import { h } from "../lib/dom.js";
import fa from "../i18n/fa.js";
import { toPersianDigits, toPersianNumber } from "../lib/format.js";
import { productCard, skeletonGrid, panel } from "../components/ui.js";
import { PRODUCTS } from "../api/fixture.js";
import { telHref } from "../lib/links.js";
import * as A from "../actions.js";

const container = (extra) => Object.assign({ maxWidth: "1280px", margin: "0 auto" }, extra || {});

export function categoryPage(s) {
  const cat = s.categories.find((c) => c.slug === s.catSlug) ||
    s.categories.find((c) => (c.children || []).some((ch) => ch.slug === s.catSlug));
  if (!cat) {
    return h("div", { class: "km-pad", style: container({ padding: "48px 32px 96px" }) },
      panel({ title: fa.category.notFound, actions: [homeBtn()] }));
  }

  // sub can be a child of `cat` (via subSlug) OR the catSlug itself may be a child slug
  const sub =
    (cat.children || []).find((c) => c.slug === s.subSlug) ||
    (cat.children || []).find((c) => c.slug === s.catSlug) || null;
  const title = sub ? sub.name : cat.name;
  const activeSub = sub ? sub.slug : null;

  const result = s.catResult;
  const total = result ? result.total : 0;
  const items = result ? result.items : [];
  const pageSize = result ? result.page_size : 9;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(s.page, totalPages);

  const catPool = PRODUCTS.filter((p) => p.category_slug === cat.slug);
  const brandNames = [...new Set(catPool.map((p) => p.brand).filter(Boolean))];

  return h("div", { class: "km-pad", style: container({ padding: "24px 32px 80px" }) },
    h("nav", { "aria-label": fa.category.breadcrumbAria, style: { display: "flex", alignItems: "center", gap: 9, fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.55)", paddingBlock: "14px 22px", flexWrap: "wrap" } },
      h("button", { class: "j-link-quiet", onClick: A.goHome, style: { fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.55)", cursor: "pointer" } }, fa.category.home),
      h("span", null, "/"),
      h("span", { style: { color: "var(--ink)", fontWeight: 600 } }, title)),

    h("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBlockEnd: 28 } },
      h("div", null,
        h("h1", { style: { margin: 0, fontSize: "var(--fs-h1-flat)", fontWeight: 800, letterSpacing: "-0.015em" } }, title),
        h("p", { "aria-live": "polite", style: { margin: "10px 0 0", fontSize: 15, color: "rgb(var(--ink-rgb) / 0.6)", lineHeight: 1.75 } }, fa.category.resultCount(total))),
      h("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
        h("button", { "data-mob": "", onClick: A.toggleFilters, class: "j-btn",
          style: { display: "none", background: "var(--ink)", color: "var(--surface)", padding: "12px 20px", borderRadius: "var(--r-5)", fontSize: "14.5px", fontWeight: 600, cursor: "pointer" } }, fa.category.filtersButton),
        h("label", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgb(var(--ink-rgb) / 0.6)" } },
          fa.category.sort,
          h("select", { onChange: (e) => A.setSort(e.target.value), value: s.sort,
            style: { padding: "11px 14px", border: "1px solid rgb(var(--ink-rgb) / 0.18)", borderRadius: "var(--r-5)", background: "var(--surface)", fontSize: "14.5px", color: "var(--ink)" } },
            fa.finder.sorts.map((o) => h("option", { key: o.value, value: o.value }, o.label)))))),

    h("div", { class: "km-cat", style: { display: "grid", gridTemplateColumns: "268px 1fr", gap: 36, alignItems: "start" } },
      sidebar(s, cat, activeSub, brandNames, catPool, total),
      s.filtersOpen && h("div", { onClick: A.toggleFilters, class: "km-fbackdrop", style: { position: "fixed", inset: 0, background: "rgb(var(--emerald-rgb) / 0.5)", zIndex: 81 } }),
      resultsColumn(s, items, total, page, totalPages)));
}

function homeBtn() {
  return h("button", { class: "j-btn j-btn--ink", onClick: A.goHome, style: { padding: "13px 24px", borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600 } }, fa.account.ordersEmptyCta);
}

/* ------------------------------------------------------------- sidebar --- */
function sidebar(s, cat, activeSub, brandNames, catPool, total) {
  const subLinks = [{ slug: null, name: fa.category.allOf(cat.name), count: catPool.length }]
    .concat((cat.children || []).map((ch) => ({ slug: ch.slug, name: ch.name, count: PRODUCTS.filter((p) => p.sub_slug === ch.slug).length })));

  return h("aside", { class: "km-filters", "data-open": String(s.filtersOpen), "aria-label": fa.category.filtersHeading,
    style: { display: "flex", flexDirection: "column", gap: 24, background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.09)", borderRadius: "var(--r-6)", padding: 22 } },

    h("div", { "data-mob": "", style: { display: "none", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", insetBlockStart: -22, background: "var(--surface)", paddingBlock: "6px 12px", marginBlockEnd: -8, borderBlockEnd: "1px solid rgb(var(--ink-rgb) / 0.1)" } },
      h("strong", { style: { fontSize: 17, fontWeight: 700 } }, fa.category.filtersHeading),
      h("button", { onClick: A.toggleFilters, "aria-label": fa.category.closeFilters, style: { background: "none", border: "1px solid rgb(var(--ink-rgb) / 0.16)", width: 38, height: 38, borderRadius: "var(--r-5)", cursor: "pointer", fontSize: 18, color: "var(--ink)" } }, "×")),

    h("div", null,
      h("div", { style: { fontSize: "14.5px", fontWeight: 700, marginBlockEnd: 12 } }, fa.category.subHeading),
      h("div", { style: { display: "flex", flexDirection: "column", gap: 1 } },
        subLinks.map((x) => {
          const on = (activeSub || null) === x.slug;
          return h("button", { key: String(x.slug), onClick: () => A.openCategory(cat.slug, x.slug),
            style: { background: on ? "rgb(var(--emerald-rgb) / 0.09)" : "transparent", border: "none", padding: "9px 12px", borderRadius: "var(--r-4)", textAlign: "start", fontSize: 14, color: on ? "var(--emerald)" : "rgb(var(--ink-rgb) / 0.75)", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 10 } },
            h("span", null, x.name),
            h("span", { style: { color: "rgb(var(--ink-rgb) / 0.4)", fontSize: "12.5px" } }, toPersianNumber(x.count)));
        }))),

    h("div", { style: { borderBlockStart: "1px solid rgb(var(--ink-rgb) / 0.1)", paddingBlockStart: 22 } },
      h("div", { style: { fontSize: "14.5px", fontWeight: 700, marginBlockEnd: 12 } }, fa.category.priceHeading),
      h("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
        h("input", { type: "text", inputmode: "numeric", value: s.priceMin ? toPersianDigits(s.priceMin) : "", "aria-label": fa.category.priceMinAria, placeholder: fa.category.from,
          onChange: (e) => A.setPriceMin(e.target.value), style: priceInput }),
        h("span", { style: { color: "rgb(var(--ink-rgb) / 0.35)" } }, "—"),
        h("input", { type: "text", inputmode: "numeric", value: s.priceMax ? toPersianDigits(s.priceMax) : "", "aria-label": fa.category.priceMaxAria, placeholder: fa.category.to,
          onChange: (e) => A.setPriceMax(e.target.value), style: priceInput }))),

    brandNames.length > 0 && h("div", { style: { borderBlockStart: "1px solid rgb(var(--ink-rgb) / 0.1)", paddingBlockStart: 22 } },
      h("div", { style: { fontSize: "14.5px", fontWeight: 700, marginBlockEnd: 4 } }, fa.category.brandHeading),
      h("p", { style: { margin: "0 0 12px", fontSize: "12.5px", color: "rgb(var(--ink-rgb) / 0.5)", lineHeight: 1.7 } }, fa.category.brandNote),
      h("div", { style: { display: "flex", flexDirection: "column", gap: 9 } },
        brandNames.map((b) =>
          h("label", { key: b, style: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" } },
            h("input", { type: "checkbox", checked: s.brands.includes(b), onChange: () => A.toggleBrand(b), style: { width: 17, height: 17, accentColor: "var(--emerald)" } }),
            h("span", { style: { flex: 1, direction: "ltr", textAlign: "start" } }, b),
            h("span", { style: { color: "rgb(var(--ink-rgb) / 0.4)", fontSize: "12.5px" } }, toPersianNumber(catPool.filter((p) => p.brand === b).length)))))),

    h("div", { style: { borderBlockStart: "1px solid rgb(var(--ink-rgb) / 0.1)", paddingBlockStart: 22, display: "flex", flexDirection: "column", gap: 14 } },
      h("label", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" } },
        h("input", { type: "checkbox", checked: s.inStockOnly, onChange: A.toggleInStock, style: { width: 17, height: 17, accentColor: "var(--emerald)" } }),
        h("span", null, fa.category.inStockOnly)),
      h("button", { class: "j-pill-quiet", onClick: A.clearFilters, style: { padding: 10, borderRadius: "var(--r-5)", fontSize: 14, cursor: "pointer" } }, fa.category.clear),
      h("button", { "data-mob": "", class: "j-btn", onClick: A.toggleFilters,
        style: { display: "none", background: "var(--ink)", color: "var(--surface)", border: "none", padding: 14, borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 700, cursor: "pointer", justifyContent: "center" } }, fa.category.applyMobile(total))));
}
const priceInput = { flex: 1, minWidth: 0, padding: "11px 12px", border: "1px solid rgb(var(--ink-rgb) / 0.18)", borderRadius: "var(--r-4)", background: "#fff", fontSize: 14, color: "var(--ink)" };

/* ------------------------------------------------------ results column --- */
function resultsColumn(s, items, total, page, totalPages) {
  if (s.catState === "loading" || s.catState === "idle") return h("div", null, skeletonGrid(6));

  if (s.catState === "error") {
    return h("div", null, panel({
      title: fa.category.loadErrorTitle, body: fa.category.loadErrorBody,
      actions: [h("button", { class: "j-btn j-btn--ink", onClick: A.loadCategory, style: { padding: "13px 24px", borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600 } }, fa.category.retry)],
    }));
  }

  if (total === 0) {
    return h("div", null, panel({
      title: fa.category.emptyTitle, body: fa.category.emptyBody,
      actions: [
        h("button", { class: "j-btn j-btn--ink", onClick: A.clearFilters, style: { padding: "13px 24px", borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600 } }, fa.category.clear),
        h("a", { href: telHref(s.settings.contact.phone), style: { border: "1px solid rgb(var(--ink-rgb) / 0.2)", padding: "13px 24px", borderRadius: "var(--r-5)", fontSize: 15, color: "var(--ink)", textDecoration: "none" } }, fa.category.emptyCall),
      ],
    }));
  }

  return h("div", null,
    h("div", { class: "km-g3", style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 18 } },
      items.map((p) => productCard(p, { variant: "full" }))),
    totalPages > 1 && h("nav", { "aria-label": fa.category.pagerAria, style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBlockStart: 36 } },
      h("button", { onClick: () => A.gotoPage(Math.max(1, page - 1)), disabled: page <= 1, "aria-label": fa.category.prevPage, style: pagerBtn(false) }, "→"),
      Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
        h("button", { key: n, onClick: () => A.gotoPage(n), "aria-current": n === page ? "page" : "false",
          style: pagerBtn(n === page) }, toPersianDigits(n))),
      h("button", { onClick: () => A.gotoPage(Math.min(totalPages, page + 1)), disabled: page >= totalPages, "aria-label": fa.category.nextPage, style: pagerBtn(false) }, "←")));
}
function pagerBtn(active) {
  return {
    minWidth: 42, height: 42, background: active ? "var(--ink)" : "var(--surface)",
    color: active ? "var(--surface)" : "var(--ink)", border: "1px solid " + (active ? "var(--ink)" : "rgb(var(--ink-rgb) / 0.16)"),
    borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600, cursor: "pointer",
  };
}
