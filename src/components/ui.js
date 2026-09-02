/* ui.js — shared primitives: icons, product card, skeletons, empty/error panels,
   section headings. Structure is inline style objects; every colour is a token. */

import { h } from "../lib/dom.js";
import fa from "../i18n/fa.js";
import { getState } from "../lib/state.js";
import { formatToman, toPersianNumber, stars, formatRating } from "../lib/format.js";
import { PLACEHOLDER_IMG } from "../api/fixture.js";
import { openProduct, addToCart } from "../actions.js";

/* A drawn check that strokes itself on — used by the "added to cart" state.
   base.css .km-added animates the path via stroke-dashoffset. */
export function checkGlyph() {
  return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    h("path", { d: "M5 13l4 4L19 7" }));
}
export function addedLabel(text) {
  return h("span", { class: "km-added" }, checkGlyph(), h("span", null, text));
}

/* Faint embossed cross in the start corner of an empty / terminal panel — the
   brand mark as a letterhead watermark, echoing a company that issues فاکتور
   رسمی. RTL start = top-right, matching the header lockup. Static: it sits
   inside .km-route, which already fades the panel in. */
export function letterheadMark(tone) {
  const c = tone || "var(--emerald)";
  return h("span", { "aria-hidden": "true", class: "km-letterhead", style: {
    position: "absolute", insetBlockStart: -30, insetInlineStart: -30, width: 136, height: 136,
    opacity: 0.1, color: c, pointerEvents: "none",
  } },
    h("span", { style: { position: "absolute", insetBlockStart: "50%", insetInlineStart: 0, width: "100%", height: 24, background: "currentColor", transform: "translateY(-50%)", borderRadius: 3 } }),
    h("span", { style: { position: "absolute", insetInlineStart: "50%", insetBlockStart: 0, height: "100%", width: 24, background: "currentColor", transform: "translateX(-50%)", borderRadius: 3 } }));
}

/* ---------- icons (non-directional; cart/search/user/check never flip) ---------- */
export const icon = {
  cart: () => h("svg", { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    h("path", { d: "M6 6h15l-1.5 9h-12z" }), h("path", { d: "M6 6 5 3H2" }),
    h("circle", { cx: 9, cy: 20, r: 1.4, fill: "currentColor", stroke: "none" }),
    h("circle", { cx: 18, cy: 20, r: 1.4, fill: "currentColor", stroke: "none" })),
  ring: (size = 15) => h("span", { style: { width: size, height: size, border: "1.5px solid currentColor", borderRadius: "50%", flexShrink: 0, display: "block" } }),
};

export function imgUrl(p) { return (p.images && p.images[0] && p.images[0].url) || PLACEHOLDER_IMG; }
export function imgPos(p) { return (p.images && p.images[0] && p.images[0].pos) || "50% 50%"; }

/* ---------- product card ---------- */
/**
 * productCard(p, { variant })
 *  variant "full"     — badge overlay, discount tag, rating count, low-stock line (home جدیدترین + category grid)
 *  variant "featured" — no badge overlay, no discount, rating avg only (home پرفروش‌ترین)
 *  variant "mini"     — 4:3 image, name + price only (PDP محصولات جانبی)
 */
export function productCard(p, { variant = "full" } = {}) {
  const out = p.stock === 0;
  const onSale = p.compare_at_price && p.compare_at_price > p.price;
  const discount = onSale ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
  const low = p.stock > 0 && p.stock <= 3;

  if (variant === "mini") {
    return h("article", { style: cardShell("4px") },
      h("button", { class: "j-link-quiet j-zoom", "aria-label": p.name, onClick: () => openProduct(p.slug),
        style: { padding: 0, cursor: "pointer", display: "block", width: "100%", background: "none", border: "none" } },
        h("img", { src: imgUrl(p), alt: p.name, width: 800, height: 600, loading: "lazy", decoding: "async",
          style: { display: "block", width: "100%", height: "auto", aspectRatio: "4/3", objectFit: "cover", objectPosition: imgPos(p), background: "var(--img-bg)" } })),
      h("div", { style: { padding: 14, display: "flex", flexDirection: "column", gap: 9, flex: 1 } },
        h("button", { class: "j-link-quiet j-line-clamp-2", onClick: () => openProduct(p.slug),
          style: { textAlign: "start", fontSize: "14.5px", lineHeight: 1.75, color: "var(--ink)", minHeight: 51 } }, p.name),
        h("strong", { style: { fontSize: "16.5px", fontWeight: 800 } }, formatToman(p.price))));
  }

  // Distill pass: the green «موجود» pill sat on ~15 of 17 cards saying nothing
  // the enabled Add button didn't. Only the exception — «ناموجود» — earns a
  // badge on the scan surface now; in-stock is the unmarked default. Low stock
  // still speaks, in words, on its own line below.
  const withBadge = variant === "full" && out;
  return h("article", { class: "j-card-product", style: cardShell("4px") },
    h("button", { class: "j-link-quiet", "aria-label": p.name, onClick: () => openProduct(p.slug),
      style: { padding: 0, display: "block", position: "relative", width: "100%", background: "none", border: "none", cursor: "pointer" } },
      h("img", { src: imgUrl(p), alt: p.name, width: 600, height: 600, loading: "lazy", decoding: "async",
        style: { display: "block", width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", objectPosition: imgPos(p), background: "var(--img-bg)" } }),
      withBadge && h("span", { style: {
        position: "absolute", insetBlockStart: 12, insetInlineStart: 12, fontSize: 12, fontWeight: 700,
        padding: "4px 9px", borderRadius: "var(--r-2)", color: "var(--surface)",
        background: "rgb(var(--ink-rgb) / 0.72)",
      } }, fa.card.outOfStock)),

    h("div", { style: { padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 8, minHeight: 20 } },
        h("span", { style: { fontSize: "12.5px", fontWeight: 600, color: "rgb(var(--ink-rgb) / 0.68)", letterSpacing: "0.02em", direction: "ltr" } }, p.brand || ""),
        variant === "full" && onSale && h("span", { style: {
          fontSize: 12, fontWeight: 700, color: "var(--surface)", background: "var(--danger)", padding: "3px 8px", borderRadius: "var(--r-2)",
        } }, fa.card.discountShort(discount))),

      h("button", { class: "j-link-quiet j-line-clamp-2", onClick: () => openProduct(p.slug),
        style: { textAlign: "start", fontSize: 15, lineHeight: 1.75, color: "var(--ink)", minHeight: "52.5px" } }, p.name),

      ratingRow(p),

      variant === "featured"
        ? h("strong", { style: { fontSize: 18, fontWeight: 800 } }, formatToman(p.price))
        : h("div", { style: { display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" } },
            onSale && h("span", { style: { fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.42)", textDecoration: "line-through" } }, formatToman(p.compare_at_price)),
            h("strong", { style: { fontSize: 18, fontWeight: 800 } }, formatToman(p.price))),

      // low-stock note sits ABOVE the CTA so `marginBlockStart:auto` still pins the
      // button to the card's base — keeps every CTA in a carousel row on one line.
      variant === "full" && low && h("div", { style: { marginBlockStart: "auto", fontSize: "12.5px", color: "var(--warn)", lineHeight: 1.6 } }, fa.card.lowStock(p.stock)),

      out
        ? h("button", { class: "j-pill-quiet", onClick: () => openProduct(p.slug),
            style: { marginBlockStart: (variant === "full" && low) ? 0 : "auto", padding: 12, borderRadius: "var(--r-5)", fontSize: "14.5px", fontWeight: 600, cursor: "pointer", textAlign: "center" } },
            fa.card.notify)
        : addButton(p, { marginBlockStart: (variant === "full" && low) ? 0 : "auto" })));
}

/* The add-to-cart button, with its brief in-place completion state. Reads
   justAddedId straight from the store — the render that sets it is what brings
   us here — and reverts when actions.js clears it ~1.6s later. */
function addButton(p, extra) {
  const added = getState().justAddedId === p.id;
  return h("button", {
    class: "j-btn " + (added ? "j-btn--added" : "j-btn--ink"),
    onClick: () => addToCart(p, 1),
    style: Object.assign({ padding: 12, borderRadius: "var(--r-5)", fontSize: "14.5px", fontWeight: 600,
      background: added ? "var(--emerald-live-deep)" : "var(--ink)", color: "var(--surface)" }, extra || {}),
  }, added ? addedLabel(fa.card.added) : fa.card.add);
}

function cardShell() {
  return {
    scrollSnapAlign: "start", background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.09)",
    borderRadius: "var(--r-3)", overflow: "hidden", display: "flex", flexDirection: "column",
  };
}

// The rating is the shop's own expert assessment, not customer reviews (there is
// no review system — BACKEND-GAPS #4). The «(۳۸)» count implied reviews that
// don't exist, so it's gone; the score and stars stay.
export function ratingRow(p) {
  return h("div", { style: { display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "rgb(var(--ink-rgb) / 0.7)" } },
    h("span", { style: { color: "var(--emerald)", letterSpacing: "0.05em" }, "aria-hidden": "true" }, stars(p.rating_avg)),
    h("span", null, formatRating(p.rating_avg)));
}

/* ---------- section heading with optional action on the end edge ---------- */
export function sectionHeading(title, action) {
  return h("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBlockEnd: 24 } },
    h("h2", { style: { margin: 0, fontSize: "var(--fs-h2)", fontWeight: 800, letterSpacing: "-0.01em" } }, title),
    action || null);
}

/* ---------- skeletons ---------- */
export function skeletonGrid(n = 6) {
  return h("div", { class: "km-g3", style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 18 } },
    Array.from({ length: n }, (_, i) =>
      h("div", { key: i, class: "km-shimmer", style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.08)", borderRadius: "var(--r-3)", overflow: "hidden" } },
        h("div", { style: { aspectRatio: "1/1", background: "rgb(var(--ink-rgb) / 0.06)" } }),
        h("div", { style: { padding: 16, display: "flex", flexDirection: "column", gap: 10 } },
          bar("38%", 12), bar("88%", 14), bar("56%", 14),
          h("div", { style: { height: 42, background: "rgb(var(--ink-rgb) / 0.06)", borderRadius: "var(--r-5)", marginBlockStart: 6 } })))));
}
function bar(w, hgt) {
  return h("div", { style: { height: hgt, width: w, background: "rgb(var(--ink-rgb) / 0.08)", borderRadius: "var(--r-2)" } });
}

/* ---------- empty / error panel ---------- */
export function panel({ title, body, actions = [], dashed = true, tone }) {
  return h("div", { style: {
    position: "relative", overflow: "hidden",
    background: "var(--surface)", border: (dashed ? "1px dashed " : "1px solid ") + "rgb(var(--ink-rgb) / 0.22)",
    borderRadius: "var(--r-6)", padding: "56px 32px", textAlign: "center",
  } },
    letterheadMark(tone),
    h("strong", { style: { display: "block", fontSize: 20, fontWeight: 700 } }, title),
    body && h("p", { style: { margin: "12px auto 24px", fontSize: 15, lineHeight: "var(--lh-prose)", color: "rgb(var(--ink-rgb) / 0.72)", maxWidth: "48ch" } }, body),
    actions.length && h("div", { style: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" } }, actions));
}
