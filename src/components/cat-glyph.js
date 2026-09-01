/* cat-glyph.js — the prototype renders category "icons" as small bordered shapes
   (DESIGN.md §6.1: 76px circles, no dense facet rail), varying height / width /
   radius per category. The live `icon` field is a short name string; this map is
   the local name→shape fallback, keyed by slug. */

import { h } from "../lib/dom.js";

export const GLYPH = {
  diagnostics: { h: "13px", h2: "30px", w: "30px", r: "50%" },
  consumables: { h: "13px", h2: "26px", w: "34px", r: "3px" },
  rehab:       { h: "15px", h2: "32px", w: "18px", r: "4px" },
  homecare:    { h: "13px", h2: "24px", w: "34px", r: "12px" },
  clinic:      { h: "11px", h2: "22px", w: "32px", r: "2px" },
  accessories: { h: "13px", h2: "28px", w: "28px", r: "6px" },
};
const FALLBACK = { h: "13px", h2: "26px", w: "28px", r: "4px" };

export function navGlyph(slug) {
  const g = GLYPH[slug] || FALLBACK;
  return h("span", { style: {
    width: "13px", height: g.h, border: "1.5px solid rgb(var(--bone-rgb) / 0.6)",
    borderRadius: g.r, display: "block", flexShrink: 0,
  } });
}

export function cardGlyph(slug) {
  const g = GLYPH[slug] || FALLBACK;
  return h("span", { style: {
    width: g.w, height: g.h2, border: "2px solid var(--emerald)", borderRadius: g.r, display: "block",
  } });
}
