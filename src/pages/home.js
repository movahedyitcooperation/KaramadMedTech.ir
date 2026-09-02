/* home.js — hero slider, finder, category cards, two carousels, services, trust.
   Ports lines 222–394 of the prototype. */

import { h } from "../lib/dom.js";
import fa from "../i18n/fa.js";
import { toPersianNumber } from "../lib/format.js";
import { productCard, sectionHeading } from "../components/ui.js";
import { cardGlyph, deptTint, deptDeep } from "../components/cat-glyph.js";
import { PRODUCTS } from "../api/fixture.js";
import * as A from "../actions.js";

const container = (extra) => Object.assign({ maxWidth: "1280px", margin: "0 auto" }, extra || {});

// The live CategoryTree carries no product count; over 17 fixture items this is
// cheap. A `count` facet on ProductListResult would replace it (BACKEND-GAPS #3).
function countFromAll(slug) {
  return PRODUCTS.filter((p) => p.category_slug === slug).length;
}

export function homePage(s) {
  return h("div", null,
    hero(s),
    finder(s),
    categoryCards(s),
    carousel(s, fa.home.newestHeading, fa.home.newestAria, s.homeNewest, "full",
      h("button", { class: "j-pill-quiet", onClick: () => A.openCategory("diagnostics"), style: { padding: "10px 18px", borderRadius: "var(--r-pill)", fontSize: 14, cursor: "pointer" } }, fa.home.allProducts)),
    services(s),
    carousel(s, fa.home.featuredHeading, fa.home.featuredAria, s.homeFeatured, "featured",
      h("span", { style: { fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.7)", lineHeight: 1.7 } }, fa.home.featuredNote)),
    trust(s));
}

/* ---------------------------------------------------------------- hero --- */
function hero(s) {
  const slides = s.settings.hero_slides;
  const slide = slides[s.hero];
  return h("section", { "aria-label": fa.hero.aria,
    onMouseEnter: A.heroHoverOn, onMouseLeave: A.heroHoverOff, onFocusCapture: A.heroHoverOn, onBlurCapture: A.heroHoverOff,
    onKeyDown: (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      e.key === "ArrowLeft" ? A.heroNext() : A.heroPrev();
    },
    // minHeight, not height: shorter than the old fixed 600 on every screen, but
    // it still grows to hold the headline + highlight + two CTAs on a narrow
    // phone instead of clipping them.
    style: { background: "var(--emerald)", color: "var(--bone)", position: "relative", overflow: "hidden", minHeight: "clamp(468px, 58vh, 552px)", display: "flex", alignItems: "center" } },

    h("div", { "aria-hidden": "true", style: { position: "absolute", inset: 0 } },
      slides.map((sl, i) =>
        h("img", { key: sl.id, src: sl.image, alt: "", width: 1656, height: 939, class: "j-hero-img",
          fetchpriority: i === 0 ? "high" : undefined, loading: i === 0 ? undefined : "lazy", decoding: "async",
          style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: ["22% 50%", "38% 50%", "32% 50%"][i] || "50% 50%",
            opacity: s.hero === i ? 1 : 0, transform: s.hero === i ? "scale(1)" : "scale(1.02)" } })),
      // darken the inline-start (right, in RTL) where the text column sits — the
      // prototype's 90deg darkened the wrong edge for RTL and the copy lost
      // contrast. Quieter pass: the falloff is gentler than before (peak 0.9 →
      // 0.82) while keeping bone text clear of 4.5:1 over the darkest photo.
      h("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(270deg, rgb(8 20 15 / 0.82) 0%, rgb(8 20 15 / 0.6) 40%, rgb(8 20 15 / 0.26) 70%, rgb(8 20 15 / 0.08) 100%)" } })),

    h("div", { class: "km-pad", style: container({ position: "relative", width: "100%", padding: "48px 32px 158px", display: "flex", flexDirection: "column", justifyContent: "center" }) },
      h("div", { key: "h" + s.hero, class: "km-slidein", style: { maxWidth: 640 } },
        h("div", { style: { fontSize: 14, color: "rgb(var(--bone-rgb) / 0.7)", lineHeight: 1.7 } },
          fa.hero.counter(s.hero + 1, slides.length)),
        h("h1", { style: { margin: "14px 0 0", fontSize: "var(--fs-display)", fontWeight: 800, lineHeight: "var(--lh-tight)", letterSpacing: "var(--track-display)", textWrap: "pretty", maxWidth: "20ch", textShadow: "0 1px 12px rgb(0 0 0 / 0.28)" } }, slide.title),
        h("p", { style: { margin: "20px 0 0", fontSize: "var(--fs-lead)", lineHeight: 1.85, color: "rgb(var(--bone-rgb) / 0.9)", maxWidth: "44ch", borderInlineStart: "2px solid var(--emerald-live)", paddingInlineStart: 18 } }, slide.highlight),
        h("div", { style: { display: "flex", flexWrap: "wrap", gap: 12, marginBlockStart: 32 } },
          h("button", { class: "j-btn j-btn--bone", onClick: () => A.openCategory(slide.cta_href),
            style: { padding: "16px 28px", borderRadius: "var(--r-5)", fontSize: 16, fontWeight: 700 } }, slide.cta_label),
          h("button", { class: "j-btn j-btn--ghost-bone", onClick: A.togglePhone,
            style: { padding: "16px 28px", borderRadius: "var(--r-5)", fontSize: 16 } }, fa.hero.consult)))),

    // Pagination + arrows: pinned to the section's own bottom edge and aligned to
    // the content's start edge, so they hold one fixed spot no matter how tall a
    // given slide's headline and highlight run. Clear of the finder card, which
    // overlaps only the bottom 56px; the content column reserves matching
    // padding-block-end so a tall slide on a phone never runs under it.
    h("div", { class: "km-pad", style: container({ position: "absolute", insetInline: 0, insetBlockEnd: 88, paddingInline: 32, pointerEvents: "none" }) },
      h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, maxWidth: 640, pointerEvents: "auto" } },
        h("div", { style: { display: "flex", gap: 8 } },
          slides.map((sl, i) => {
            const on = s.hero === i;
            // the active dot's fill runs a linear sweep across one autoplay cycle
            // (a visible cycle timer), pausing while the hero is hovered/focused.
            const timing = on && !s.reducedMotion;
            return h("button", { key: sl.id, class: "j-hero-dot", onClick: () => A.heroGoto(i),
              "aria-label": fa.hero.dot(i + 1), "aria-current": on ? "true" : "false" },
              h("span", { key: timing ? "t" + s.hero : "f", class: "j-hero-dot-fill" + (timing ? " is-timing" : ""),
                "data-paused": String(s.heroHover) }));
          })),
        h("div", { style: { display: "flex", gap: 8 } },
          h("button", { class: "j-hero-arrow", onClick: A.heroPrev, "aria-label": fa.hero.prev, style: heroArrow }, "→"),
          h("button", { class: "j-hero-arrow", onClick: A.heroNext, "aria-label": fa.hero.next, style: heroArrow }, "←")))));
}
// background + border live in app.css .j-hero-arrow so :hover can override them
const heroArrow = { width: 44, height: 44, color: "var(--bone)", borderRadius: "var(--r-5)", cursor: "pointer", fontSize: 17 };

/* -------------------------------------------------------------- finder --- */
function finder(s) {
  return h("section", { class: "km-pad", "aria-label": fa.finder.aria, "data-finder": "",
    style: container({ paddingInline: 32, marginBlockStart: -56, position: "relative", zIndex: 10 }) },
    h("div", { class: "km-g4", style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-6)", padding: 22, boxShadow: "var(--shadow-float)", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr auto", gap: 14, alignItems: "end" } },
      field(fa.finder.category,
        h("select", { onChange: (e) => A.setFinderCat(e.target.value), value: s.finderCat, style: selectStyle },
          h("option", { key: "", value: "" }, fa.finder.allCategories),
          s.categories.map((c) => h("option", { key: c.slug, value: c.slug }, c.name)))),
      field(fa.finder.price,
        h("select", { onChange: (e) => A.setFinderBand(e.target.value), value: s.finderBand, style: selectStyle },
          fa.finder.bands.map((b) => h("option", { key: b.value, value: b.value }, b.label)))),
      field(fa.finder.sort,
        h("select", { onChange: (e) => A.setFinderSort(e.target.value), value: s.sort, style: selectStyle },
          fa.finder.sorts.map((o) => h("option", { key: o.value, value: o.value }, o.label)))),
      h("button", { class: "j-btn j-btn--ink", onClick: A.finderGo,
        style: { padding: "14px 30px", borderRadius: "var(--r-5)", fontSize: "15.5px", fontWeight: 700, height: 48 } }, fa.finder.submit)),
    h("p", { style: { margin: "10px 2px 0", fontSize: 13, color: "var(--info)", lineHeight: 1.7, display: "flex", alignItems: "baseline", gap: 8 } },
      h("span", { "aria-hidden": "true", style: { width: 6, height: 6, borderRadius: "50%", background: "var(--info)", flexShrink: 0, transform: "translateY(-1px)" } }),
      h("span", null, fa.finder.note)));
}
function field(label, control, extra) {
  return h("label", { style: Object.assign({ display: "flex", flexDirection: "column", gap: 8, fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.6)" }, extra || {}) }, label, control);
}
const selectStyle = { padding: "13px 14px", border: "1px solid rgb(var(--ink-rgb) / 0.18)", borderRadius: "var(--r-5)", background: "#fff", fontSize: 15, color: "var(--ink)" };

/* ------------------------------------------------------ category cards --- */
function categoryCards(s) {
  return h("section", { class: "km-pad", "aria-label": fa.home.categoriesAria, style: container({ padding: "64px 32px 0" }) },
    h("div", { class: "km-g6", style: { display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 18 } },
      s.categories.map((c) =>
        h("button", { key: c.slug, class: "j-cat-card", onClick: () => A.openCategory(c.slug),
          style: { background: "none", border: "none", padding: "18px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, borderRadius: "var(--r-5)" } },
          h("span", { class: "j-cat-disc", style: { width: 76, height: 76, borderRadius: "50%", background: deptTint(c.slug), border: "1px solid color-mix(in oklab, " + deptDeep(c.slug) + " 40%, transparent)", display: "grid", placeItems: "center" } }, cardGlyph(c.slug)),
          h("span", { style: { fontSize: "14.5px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.6, textAlign: "center" } }, c.name),
          h("span", { style: { fontSize: "12.5px", color: "rgb(var(--ink-rgb) / 0.72)" } }, fa.home.countUnit(countFromAll(c.slug)))))));
}

/* ----------------------------------------------------------- carousel --- */
function carousel(s, heading, aria, items, variant, action) {
  return h("section", { class: "km-pad", "aria-label": aria, style: container({ padding: "64px 32px 0" }) },
    sectionHeading(heading, action),
    items.length === 0
      ? h("div", { class: "km-scroll", style: carouselRow },
          Array.from({ length: 5 }, (_, i) => h("div", { key: i, class: "km-shimmer", style: { scrollSnapAlign: "start", background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.08)", borderRadius: "var(--r-3)", minHeight: 360 } })))
      : h("div", { class: "km-scroll km-stagger", style: carouselRow },
          // display:grid lets the single card fill the grid-stretched wrapper, so
          // every card in the row is the same height and the CTAs line up.
          // .km-stagger settles the cards in once, the moment their data lands.
          items.map((p) => h("div", { key: p.slug, style: { scrollSnapAlign: "start", display: "grid" } }, productCard(p, { variant })))));
}
const carouselRow = { display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(246px, 1fr)", gap: 18, overflowX: "auto", scrollSnapType: "x mandatory", paddingBlockEnd: 10 };

/* ----------------------------------------------------------- services --- */
function services(s) {
  return h("section", { class: "km-pad", "aria-label": fa.home.servicesAria, style: container({ padding: "72px 32px 0" }) },
    h("div", { class: "km-g4", style: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 2, background: "rgb(var(--ink-rgb) / 0.1)", border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-7)", overflow: "hidden" } },
      fa.services.map((x, i) =>
        h("div", { key: i, style: { background: "var(--surface)", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 14, minHeight: 192 } },
          h("span", { style: { width: 26, height: 26, border: "2px solid var(--emerald-live)", borderRadius: x.r, display: "block" } }),
          h("strong", { style: { fontSize: 17, fontWeight: 700, lineHeight: 1.6 } }, x.title),
          h("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.85, color: "rgb(var(--ink-rgb) / 0.62)" } }, x.body),
          h("button", { class: "j-link-quiet", onClick: () => A.runAction(x.go), style: { fontSize: 14, fontWeight: 600, color: "var(--emerald)", cursor: "pointer", textAlign: "start", marginBlockStart: "auto" } }, x.action)))));
}

/* -------------------------------------------------------------- trust --- */
function trust() {
  return h("section", { "aria-label": fa.home.trustAria, style: { marginBlockStart: 80, background: "linear-gradient(180deg, var(--emerald-hi), var(--emerald) 60%)", color: "var(--bone)" } },
    h("div", { class: "km-pad km-trust", style: container({ paddingInline: 32, display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))" }) },
      fa.trust.map((t, i) =>
        h("div", { key: i, style: { padding: "30px 20px", borderInlineStart: "1px solid rgb(var(--bone-rgb) / 0.14)", display: "flex", flexDirection: "column", gap: 9 } },
          h("span", { style: { width: 8, height: 8, background: "var(--emerald-live)", borderRadius: "50%", display: "block" } }),
          h("strong", { style: { fontSize: 15, fontWeight: 700, lineHeight: 1.6 } }, t.title),
          h("span", { style: { fontSize: 13, lineHeight: 1.75, color: "rgb(var(--bone-rgb) / 0.65)" } }, t.body)))));
}
