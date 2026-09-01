/* product.js — PDP: gallery + thumbs, purchase card, highlight card, three tabs
   (review / specs / comments), safety block, related carousel.
   Ports lines 555–719 of the prototype. */

import { h } from "../lib/dom.js";
import fa from "../i18n/fa.js";
import { formatToman, toPersianDigits, toPersianNumber, stars, formatRating } from "../lib/format.js";
import { productCard, panel, addedLabel, letterheadMark } from "../components/ui.js";
import { imgUrl, imgPos } from "../components/ui.js";
import { deptDeep } from "../components/cat-glyph.js";
import { telHref, waHref } from "../lib/links.js";
import * as A from "../actions.js";

const container = (extra) => Object.assign({ maxWidth: "1280px", margin: "0 auto" }, extra || {});
const SAFETY_KEYS = ["وضعیت سترون", "تاریخ انقضا", "شرایط نگهداری", "دمای نگهداری", "کد IRC", "ضدعفونی", "ضدعفونی روکش"];

export function productPage(s) {
  if (s.pdpState === "loading" || !s.product) {
    return h("div", { class: "km-pad", style: container({ padding: "48px 32px 96px" }) }, pdpSkeleton());
  }
  if (s.pdpState === "notfound" || s.pdpState === "error") {
    return h("div", { class: "km-pad", style: container({ padding: "48px 32px 96px" }) },
      panel({ title: s.pdpState === "notfound" ? fa.pdp.notFound : fa.category.loadErrorTitle, body: s.pdpState === "error" ? fa.category.loadErrorBody : null,
        actions: [h("button", { class: "j-btn j-btn--ink", onClick: A.goHome, style: { padding: "13px 24px", borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600 } }, fa.account.ordersEmptyCta)] }));
  }

  const p = s.product;
  const cat = s.categories.find((c) => c.id === p.category_id);
  const onSale = p.compare_at_price && p.compare_at_price > p.price;
  const discount = onSale ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
  const out = p.stock === 0;
  const images = p.images && p.images.length ? p.images : [{ url: imgUrl(p), alt: p.name, pos: imgPos(p) }];
  const mainImg = images[Math.min(s.pdpThumb, images.length - 1)] || images[0];

  const groups = [];
  for (const sp of p.specs) {
    let g = groups.find((x) => x.name === sp.group);
    if (!g) { g = { name: sp.group, rows: [] }; groups.push(g); }
    g.rows.push(sp);
  }
  const safety = p.specs.filter((sp) => SAFETY_KEYS.includes(sp.key));

  return h("div", { class: "km-pad", style: container({ padding: "24px 32px 80px" }) },
    h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, paddingBlock: "14px 24px", flexWrap: "wrap" } },
      h("nav", { "aria-label": fa.pdp.breadcrumbAria, style: { display: "flex", alignItems: "center", gap: 9, fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.72)", flexWrap: "wrap" } },
        h("button", { class: "j-link-quiet", onClick: A.goHome, style: { fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.72)", cursor: "pointer" } }, fa.pdp.home),
        h("span", null, "/"),
        cat && h("button", { class: "j-link-quiet", onClick: () => A.openCategory(cat.slug), style: { fontSize: "13.5px", color: deptDeep(cat.slug), fontWeight: 600, cursor: "pointer" } }, cat.name),
        cat && h("span", null, "/"),
        h("span", { style: { color: "var(--ink)", fontWeight: 600 } }, p.name)),
      h("button", { class: "j-pill-quiet", onClick: A.pdpShare, style: { padding: "9px 16px", borderRadius: "var(--r-pill)", fontSize: "13.5px", cursor: "pointer" } }, fa.pdp.share)),

    h("div", { class: "km-pdp", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "start" } },
      // gallery
      h("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
        h("div", { class: "j-zoom", style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-5)", overflow: "hidden", aspectRatio: "1/1" } },
          h("img", { src: mainImg.url, alt: mainImg.alt || p.name, width: 1385, height: 1385, loading: "lazy", decoding: "async",
            style: { display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: mainImg.pos || "50% 50%", background: "var(--img-bg)" } })),
        h("div", { style: { display: "flex", gap: 10 } },
          (images.length > 1 ? images : [images[0], images[0], images[0], images[0]]).slice(0, 4).map((im, i) =>
            h("button", { key: i, onClick: () => A.setPdpThumb(Math.min(i, images.length - 1)), "aria-label": fa.pdp.thumb(i + 1),
              style: { width: 76, height: 76, border: "1px solid " + (i === s.pdpThumb ? "var(--emerald)" : "rgb(var(--ink-rgb) / 0.14)"), borderRadius: "var(--r-3)", background: "var(--img-bg)", cursor: "pointer", padding: 0, overflow: "hidden" } },
              h("img", { src: im.url, alt: "", width: 152, height: 152, loading: "lazy", decoding: "async", style: { display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: im.pos || "50% 50%" } })))))
      ,
      // purchase side
      h("div", { style: { display: "flex", flexDirection: "column", gap: 22 } },
        h("div", null,
          h("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } },
            h("span", { style: { fontSize: "13.5px", fontWeight: 700, color: "rgb(var(--ink-rgb) / 0.55)", letterSpacing: "0.03em", direction: "ltr" } }, p.brand || ""),
            h("span", { style: { fontSize: 13, fontWeight: 700, padding: "5px 11px", borderRadius: "var(--r-2)", color: "var(--surface)", background: out ? "rgb(var(--ink-rgb) / 0.72)" : "var(--emerald-live-deep)" } }, out ? fa.pdp.outOfStock : fa.pdp.inStock)),
          h("h1", { style: { margin: "12px 0 0", fontSize: "var(--fs-h1)", fontWeight: 800, lineHeight: 1.5, letterSpacing: "-0.012em", textWrap: "pretty" } }, p.name),
          p.short_desc && h("p", { style: { margin: "14px 0 0", fontSize: 16, lineHeight: 1.9, color: "rgb(var(--ink-rgb) / 0.68)", maxWidth: "52ch" } }, p.short_desc)),

        h("div", { style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-6)", padding: 24, display: "flex", flexDirection: "column", gap: 18 } },
          h("div", { style: { display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" } },
            onSale && h("span", { style: { fontSize: 15, color: "rgb(var(--ink-rgb) / 0.42)", textDecoration: "line-through" } }, formatToman(p.compare_at_price)),
            h("strong", { style: { fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" } }, formatToman(p.price)),
            onSale && h("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--surface)", background: "var(--danger)", padding: "4px 9px", borderRadius: "var(--r-2)" } }, fa.pdp.discount(discount))),

          out
            ? h("a", { href: waHref(s.settings),
                style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, textDecoration: "none",
                  padding: "16px 28px", borderRadius: "var(--r-5)", fontSize: "16.5px", fontWeight: 700,
                  background: "var(--ink)", color: "var(--surface)" } },
                h("span", { style: { width: 7, height: 7, borderRadius: "50%", background: "var(--emerald-live)", flexShrink: 0 } }),
                h("span", null, fa.pdp.notifyRestock))
            : h("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } },
                h("div", { style: { display: "flex", alignItems: "center", border: "1px solid rgb(var(--ink-rgb) / 0.18)", borderRadius: "var(--r-5)", background: "#fff", overflow: "hidden" } },
                  h("button", { class: "j-step", onClick: A.pdpQtyDown, "aria-label": fa.pdp.qtyDown, style: stepBtn }, "−"),
                  h("input", { type: "text", inputmode: "numeric", "aria-label": fa.pdp.qty, value: toPersianDigits(s.pdpQty), onChange: (e) => A.pdpQtySet(e.target.value),
                    style: { width: 58, height: 48, border: "none", textAlign: "center", fontSize: 16, fontWeight: 700, color: "var(--ink)", background: "none" } }),
                  h("button", { class: "j-step", onClick: A.pdpQtyUp, "aria-label": fa.pdp.qtyUp, style: stepBtn }, "+")),
                (() => {
                  const added = s.justAddedId === p.id;
                  return h("button", { class: "j-btn " + (added ? "j-btn--added" : "j-btn--ink"), onClick: A.pdpAdd,
                    style: { flex: 1, minWidth: 210, padding: "16px 28px", borderRadius: "var(--r-5)", fontSize: "16.5px", fontWeight: 700,
                      background: added ? "var(--emerald-live-deep)" : "var(--ink)", color: "var(--surface)" } },
                    added ? addedLabel(fa.card.added) : fa.pdp.buy);
                })()),

          h("div", { "aria-live": "polite", style: { fontSize: "13.5px", lineHeight: 1.75, color: "var(--warn)", minHeight: 20 } },
            (() => {
              const note = s.pdpStockNote || (p.stock > 0 && p.stock <= 3 ? fa.pdp.lowStockNote(p.stock) : "");
              return note ? h("span", { key: note, class: "km-note" }, note) : "";
            })()),

          h("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", borderBlockStart: "1px solid rgb(var(--ink-rgb) / 0.1)", paddingBlockStart: 18 } },
            h("button", { disabled: true, style: soonBtn }, fa.pdp.compareSoon),
            h("button", { disabled: true, style: soonBtn }, fa.pdp.saveSoon))),

        h("div", { style: { background: "var(--emerald)", color: "var(--bone)", borderRadius: "var(--r-6)", padding: 24, display: "flex", flexDirection: "column", gap: 18 } },
          h("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" } },
            h("strong", { style: { fontSize: 16, fontWeight: 700 } }, fa.pdp.keySpecs),
            h("span", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: "13.5px", color: "rgb(var(--bone-rgb) / 0.72)" } },
              h("span", { style: { letterSpacing: "0.06em" }, "aria-hidden": "true" }, stars(p.rating_avg)),
              h("span", null, fa.pdp.ratingLine(formatRating(p.rating_avg), p.rating_count)))),
          h("dl", { style: { margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "12px 20px", fontSize: "14.5px" } },
            p.specs.slice(0, 4).map((sp, i) =>
              h("div", { key: i, style: { display: "contents" } },
                h("dt", { style: { color: "rgb(var(--bone-rgb) / 0.6)", lineHeight: 1.7 } }, sp.key),
                h("dd", { style: { margin: 0, lineHeight: 1.7, fontWeight: 600 } }, sp.value)))),
          h("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", borderBlockStart: "1px solid rgb(var(--bone-rgb) / 0.16)", paddingBlockStart: 18 } },
            h("a", { href: telHref(s.settings.contact.phone), style: { background: "var(--bone)", color: "var(--ink)", padding: "12px 20px", borderRadius: "var(--r-5)", fontSize: "14.5px", fontWeight: 700, textDecoration: "none" } }, fa.pdp.consultPhone),
            h("a", { href: waHref(s.settings), style: { border: "1px solid rgb(var(--bone-rgb) / 0.34)", color: "var(--bone)", padding: "12px 20px", borderRadius: "var(--r-5)", fontSize: "14.5px", textDecoration: "none" } }, fa.pdp.askWhatsapp)),
          h("div", { style: { fontSize: "12.5px", color: "rgb(var(--bone-rgb) / 0.55)", lineHeight: 1.8 } },
            fa.pdp.sku + " ", h("span", { style: { direction: "ltr", display: "inline-block", fontWeight: 600, letterSpacing: "0.03em" } }, p.sku)))))
    ,
    // tabs
    tabs(s, p, groups, safety),

    // related
    s.related.length > 0 && h("section", { "aria-label": fa.pdp.relatedHeading, style: { marginBlockStart: 64 } },
      h("h2", { style: { margin: "0 0 22px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em" } }, fa.pdp.relatedHeading),
      h("div", { class: "km-scroll", style: { display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(232px, 1fr)", gap: 18, overflowX: "auto", scrollSnapType: "x mandatory", paddingBlockEnd: 10 } },
        s.related.map((rp) => h("div", { key: rp.slug, style: { scrollSnapAlign: "start", display: "grid" } }, productCard(rp, { variant: "mini" }))))));
}
const stepBtn = { width: 44, height: 48, background: "none", border: "none", fontSize: 19, color: "var(--ink)", cursor: "pointer" };
const soonBtn = { background: "var(--info-bg)", border: "1px dashed var(--info-border)", padding: "10px 16px", borderRadius: "var(--r-5)", fontSize: "13.5px", color: "var(--info)", cursor: "not-allowed" };

/* -------------------------------------------------------------- tabs --- */
function tabs(s, p, groups, safety) {
  const defs = [
    { id: "review", label: fa.pdp.tabReview },
    { id: "specs", label: fa.pdp.tabSpecs },
    { id: "comments", label: fa.pdp.tabComments },
  ];
  return h("section", { style: { marginBlockStart: 64 } },
    h("div", { role: "tablist", "aria-label": fa.pdp.tabsAria, style: { display: "flex", gap: 2, borderBlockEnd: "1px solid rgb(var(--ink-rgb) / 0.14)", flexWrap: "wrap" } },
      defs.map((t) => {
        const on = s.pdpTab === t.id;
        return h("button", { key: t.id, role: "tab", "aria-selected": String(on), onClick: () => A.setPdpTab(t.id),
          style: { background: on ? "rgb(var(--emerald-rgb) / 0.06)" : "transparent", border: "none", borderBlockEnd: "2px solid " + (on ? "var(--emerald)" : "transparent"), padding: "14px 22px", fontSize: "15.5px", fontWeight: on ? 700 : 500, color: on ? "var(--emerald)" : "rgb(var(--ink-rgb) / 0.6)", cursor: "pointer" } }, t.label);
      })),
    h("div", { role: "tabpanel", style: { paddingBlockStart: 28 } },
      s.pdpTab === "review" && h("div", { style: { maxWidth: "72ch", display: "flex", flexDirection: "column", gap: 16 } },
        p.description.map((para, i) => h("p", { key: i, style: { margin: 0, fontSize: "16.5px", lineHeight: 1.95, color: "rgb(var(--ink-rgb) / 0.82)", textWrap: "pretty" } }, para))),

      s.pdpTab === "specs" && h("div", { style: { display: "flex", flexDirection: "column", gap: 26, maxWidth: 820 } },
        safety.length > 0 && h("div", { style: { background: "var(--warn-bg)", border: "1px solid var(--warn-border)", borderRadius: "var(--r-6)", padding: "18px 20px" } },
          h("strong", { style: { display: "block", fontSize: "14.5px", fontWeight: 700, color: "var(--warn-strong)", marginBlockEnd: 12 } }, fa.pdp.safetyHeading),
          h("dl", { style: { margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "9px 18px", fontSize: "14.5px" } },
            safety.map((sp, i) => h("div", { key: i, style: { display: "contents" } },
              h("dt", { style: { color: "rgb(var(--ink-rgb) / 0.6)", lineHeight: 1.7 } }, sp.key),
              h("dd", { style: { margin: 0, lineHeight: 1.7, fontWeight: 600 } }, sp.value))))),
        groups.map((g, i) =>
          h("div", { key: i },
            h("div", { style: { fontSize: 16, fontWeight: 700, color: "var(--emerald)", paddingBlockEnd: 10, borderBlockEnd: "1px solid rgb(var(--ink-rgb) / 0.14)" } }, g.name),
            g.rows.map((r, j) =>
              h("div", { key: j, style: { display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, padding: "13px 0", borderBlockEnd: "1px solid rgb(var(--ink-rgb) / 0.07)", fontSize: 15 } },
                h("span", { style: { color: "rgb(var(--ink-rgb) / 0.58)", lineHeight: 1.7 } }, r.key),
                h("span", { style: { lineHeight: 1.7, fontWeight: 500 } }, r.value))))),
      ),

      s.pdpTab === "comments" && h("div", { style: { position: "relative", overflow: "hidden", background: "var(--surface)", border: "1px dashed rgb(var(--ink-rgb) / 0.22)", borderRadius: "var(--r-6)", padding: "48px 32px", textAlign: "center", maxWidth: 720 } },
        letterheadMark(),
        h("strong", { style: { display: "block", fontSize: 19, fontWeight: 700 } }, fa.pdp.commentsSoonTitle),
        h("p", { style: { margin: "12px auto 22px", fontSize: 15, lineHeight: 1.9, color: "rgb(var(--ink-rgb) / 0.62)", maxWidth: "48ch" } }, fa.pdp.commentsSoonBody),
        h("a", { href: waHref(s.settings), style: { display: "inline-block", background: "var(--ink)", color: "var(--surface)", padding: "13px 24px", borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600, textDecoration: "none" } }, fa.pdp.commentsSoonCta))));
}

/* ---------------------------------------------------------- skeleton --- */
function pdpSkeleton() {
  const box = (extra) => h("div", { class: "km-shimmer", style: Object.assign({ background: "rgb(var(--ink-rgb) / 0.06)", borderRadius: "var(--r-4)" }, extra || {}) });
  return h("div", { class: "km-pdp", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "start" } },
    box({ aspectRatio: "1/1" }),
    h("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
      box({ height: 16, width: "30%" }), box({ height: 34, width: "80%" }), box({ height: 90 }), box({ height: 160 })));
}
