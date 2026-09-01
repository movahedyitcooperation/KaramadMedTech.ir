/* cat-glyph.js — per-department category icons. The six icons the owner designed
   live in assets/categories/<slug>.webp (their original dark-green line art, white
   background removed, trimmed square). They are shown as-is — `catIcon` does not
   recolour them. The geometric GLYPH map below is only the fallback for an
   unmapped category slug, and for the emerald nav bar where the dark icon on a
   dark ground would not read. Sizes follow DESIGN.md §6.1 + §2·b. */

import { h } from "../lib/dom.js";

/* Department wayfinding spectrum (tokens.css §2·b). The six top-level slugs each
   own one hue; anything else falls back to the neutral surface / emerald so an
   unmapped category never throws or renders an invalid custom property. */
const DEPT_SLUGS = new Set(["diagnostics", "consumables", "rehab", "homecare", "clinic", "accessories"]);
export const deptTint = (slug) => (DEPT_SLUGS.has(slug) ? `var(--dept-${slug})` : "var(--surface)");
export const deptDeep = (slug) => (DEPT_SLUGS.has(slug) ? `var(--dept-${slug}-deep)` : "var(--emerald)");

const ICON_URL = (slug) => new URL(`../assets/categories/${slug}.webp`, import.meta.url).href;

/**
 * catIcon(slug, size) — the owner's category icon, unmodified, sized to `size`.
 * Returns null for an unmapped slug so callers can fall back to `glyphShape`.
 */
export function catIcon(slug, size) {
  if (!DEPT_SLUGS.has(slug)) return null;
  return h("img", { src: ICON_URL(slug), alt: "", "aria-hidden": "true", width: size, height: size,
    loading: "lazy", decoding: "async",
    style: { display: "block", width: size, height: size, flexShrink: 0, objectFit: "contain" } });
}

/* ---- geometric fallback (unmapped slugs, and the emerald nav bar) ---- */
export const GLYPH = {
  diagnostics: { h: "13px", h2: "30px", w: "30px", r: "50%" },
  consumables: { h: "13px", h2: "26px", w: "34px", r: "3px" },
  rehab:       { h: "15px", h2: "32px", w: "18px", r: "4px" },
  homecare:    { h: "13px", h2: "24px", w: "34px", r: "12px" },
  clinic:      { h: "11px", h2: "22px", w: "32px", r: "2px" },
  accessories: { h: "13px", h2: "28px", w: "28px", r: "6px" },
};
const FALLBACK = { h: "13px", h2: "26px", w: "28px", r: "4px" };

function glyphShape(slug, { size, stroke, onDark }) {
  const g = GLYPH[slug] || FALLBACK;
  return h("span", { style: {
    width: size || g.w, height: size || g.h2,
    border: stroke + " solid " + (onDark ? "rgb(var(--bone-rgb) / 0.6)" : deptDeep(slug)),
    borderRadius: g.r, display: "block", flexShrink: 0,
  } });
}

/* nav bar sits on --emerald-deep — the dark icon would not read there, so the
   geometric bone shape stays. */
export function navGlyph(slug) {
  return glyphShape(slug, { size: "13px", stroke: "1.5px", onDark: true });
}

export function cardGlyph(slug) {
  return catIcon(slug, 60) || glyphShape(slug, { stroke: "2px" });
}

/* Small department chip — the icon on its own tint, used to mark a category H1,
   a mega-menu panel, a mobile-nav row. Non-colour cue: the icon itself. */
export function deptMark(slug, size = 34) {
  const inner = Math.round(size * 0.8);
  return h("span", { "aria-hidden": "true", style: {
    width: size, height: size, flexShrink: 0, display: "grid", placeItems: "center",
    background: deptTint(slug), borderRadius: "var(--r-4)",
    border: "1px solid color-mix(in oklab, " + deptDeep(slug) + " 40%, transparent)",
  } }, catIcon(slug, inner) || glyphShape(slug, { size: Math.round(size * 0.42) + "px", stroke: "2px" }));
}
