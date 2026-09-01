/* shell.js — layout shell: header + mega menu + cart dropdown, mobile nav drawer,
   footer, WhatsApp FAB, toast layer. Ports lines 61–218 / 899–943 of the prototype. */

import { h } from "../lib/dom.js";
import fa from "../i18n/fa.js";
import { formatToman, toPersianNumber } from "../lib/format.js";
import { telHref, waHref, socialHref } from "../lib/links.js";
import { navGlyph } from "./cat-glyph.js";
import { icon } from "./ui.js";
import * as A from "../actions.js";

const container = (extra) => Object.assign({ maxWidth: "1280px", margin: "0 auto" }, extra || {});

function cartCount(cart) { return cart.items.reduce((a, l) => a + l.qty, 0); }
function cartSubtotal(cart) { return cart.items.reduce((a, l) => a + l.unit_price * l.qty, 0); }

/* ------------------------------------------------------------------ header --- */
export function header(s) {
  const count = cartCount(s.cart);
  return h("header", { style: { background: "var(--emerald)", color: "var(--bone)", position: "sticky", insetBlockStart: 0, zIndex: 60 } },
    h("div", { class: "km-pad", style: container({ padding: "16px 32px", display: "flex", alignItems: "center", gap: 24 }) },

      h("button", { onClick: A.goHome, "aria-label": fa.brand.homeAria,
        style: { display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", flexShrink: 0 } },
        h("span", { style: { width: 38, height: 38, border: "1.5px solid rgb(var(--bone-rgb) / 0.55)", display: "grid", placeItems: "center", flexShrink: 0 } },
          h("span", { style: { position: "relative", width: 16, height: 16, display: "block" } },
            h("span", { style: { position: "absolute", insetBlockStart: "6.5px", insetInlineStart: 0, width: 16, height: 3, background: "var(--bone)", display: "block" } }),
            h("span", { style: { position: "absolute", insetInlineStart: "6.5px", insetBlockStart: 0, width: 3, height: 16, background: "var(--bone)", display: "block" } }))),
        h("span", { style: { display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 } },
          h("span", { style: { fontSize: 23, fontWeight: 800, letterSpacing: "-0.01em" } }, fa.brand.name),
          h("span", { style: { fontSize: "12.5px", fontWeight: 400, color: "rgb(var(--bone-rgb) / 0.62)" } }, fa.brand.tagline))),

      h("button", { "data-desk": "", class: "j-hdr-finder", onClick: A.focusFinder,
        style: { flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: "var(--r-pill)", fontSize: 15, cursor: "pointer", textAlign: "start" } },
        icon.ring(15), h("span", null, fa.header.finder)),

      h("div", { style: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginInlineStart: "auto" } },
        h("button", { "data-mob": "", class: "j-hdr-ctl", onClick: A.focusFinder, "aria-label": fa.header.finderShort,
          style: { display: "none", width: 44, height: 44, borderRadius: "var(--r-5)", cursor: "pointer", alignItems: "center", justifyContent: "center" } }, icon.ring(16)),

        h("button", { "data-desk": "", class: "j-hdr-ctl", onClick: A.togglePhone, "aria-expanded": String(s.phoneOpen),
          style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--r-pill)", fontSize: "14.5px", cursor: "pointer" } },
          h("span", { style: { width: 7, height: 7, background: "var(--emerald-live)", borderRadius: "50%", display: "block" } }),
          h("span", { style: { direction: "ltr", unicodeBidi: "plaintext" } }, s.phoneOpen ? s.settings.contact.phone : fa.header.phone)),

        h("button", { "data-desk": "", class: "j-hdr-ctl", onClick: A.goLogin,
          style: { padding: "10px 18px", borderRadius: "var(--r-pill)", fontSize: "14.5px", cursor: "pointer" } },
          s.loggedIn ? fa.header.account : fa.header.login),

        h("div", { style: { position: "relative" } },
          h("button", { class: "j-hdr-cart", onClick: A.toggleCart, "aria-expanded": String(s.cartOpen), "aria-label": fa.header.cart,
            style: { display: "flex", alignItems: "center", gap: 9, padding: "11px 18px", borderRadius: "var(--r-pill)", fontSize: "14.5px", fontWeight: 600, cursor: "pointer", border: "none" } },
            icon.cart(), h("span", { class: "km-cart-label" }, fa.header.cart),
            count > 0 && h("span", { style: { fontSize: "14.5px", fontWeight: 700 } }, toPersianNumber(count))),
          s.cartOpen && cartDropdown(s)),

        h("button", { "data-mob": "", class: "j-hdr-ctl", onClick: A.toggleMobileNav, "aria-label": fa.header.menu,
          style: { display: "none", width: 44, height: 44, borderRadius: "var(--r-5)", cursor: "pointer", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 } },
          h("span", { style: { width: 18, height: 2, background: "currentColor", display: "block" } }),
          h("span", { style: { width: 18, height: 2, background: "currentColor", display: "block" } }),
          h("span", { style: { width: 18, height: 2, background: "currentColor", display: "block" } })))),

    navBar(s));
}

/* -------------------------------------------------------------- nav + mega --- */
function navBar(s) {
  return h("nav", { "data-desk": "", "aria-label": fa.nav.aria, onMouseLeave: A.closeMega,
    onKeyDown: (e) => { if (e.key === "Escape") A.closeMega(); },
    style: { borderBlockStart: "1px solid rgb(var(--bone-rgb) / 0.12)", background: "var(--emerald-deep)", position: "relative" } },
    h("div", { class: "km-pad", style: container({ paddingInline: 32, display: "flex", alignItems: "stretch", gap: 2 }) },
      s.categories.map((c) =>
        h("button", { key: c.slug, onMouseEnter: () => A.hoverMega(c.slug), onFocus: () => A.hoverMega(c.slug), onClick: () => A.openCategory(c.slug),
          "aria-expanded": String(s.megaCat === c.slug),
          style: { background: s.megaCat === c.slug ? "rgb(var(--bone-rgb) / 0.14)" : "transparent", border: "none", color: "var(--bone)", padding: "15px 16px", fontSize: "14.5px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 9 } },
          navGlyph(c.slug), h("span", null, c.name)))),
    s.megaCat && megaPanel(s));
}

function megaPanel(s) {
  const cat = s.categories.find((c) => c.slug === s.megaCat);
  if (!cat) return null;
  const kids = cat.children || [];
  const per = Math.ceil(kids.length / 3) || 1;
  const cols = [];
  for (let i = 0; i < 3; i++) {
    const chunk = kids.slice(i * per, (i + 1) * per);
    if (chunk.length) cols.push({ first: i === 0, links: chunk });
  }
  return h("div", { class: "j-dropin--fast", style: {
    position: "absolute", insetInline: 0, insetBlockStart: "100%", background: "var(--surface)",
    borderBlockEnd: "1px solid rgb(var(--ink-rgb) / 0.12)", boxShadow: "0 26px 50px -12px rgb(var(--emerald-rgb) / 0.28)", zIndex: 65,
  } },
    h("div", { class: "km-pad", style: container({ padding: 32, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 300px", gap: 36 }) },
      cols.map((col, i) =>
        h("div", { key: i },
          h("div", { style: { fontSize: "14.5px", fontWeight: 700, color: "var(--emerald)", paddingBlockEnd: 12, marginBlockEnd: 10, borderBlockEnd: "1px solid rgb(var(--ink-rgb) / 0.12)", visibility: col.first ? "visible" : "hidden" } }, fa.nav.subheading),
          h("div", { style: { display: "flex", flexDirection: "column", gap: 2 } },
            col.links.map((l) =>
              h("button", { key: l.slug, class: "j-link-quiet", onClick: () => A.openCategory(cat.slug, l.slug),
                style: { padding: "8px 0", textAlign: "start", fontSize: "14.5px", color: "rgb(var(--ink-rgb) / 0.78)", cursor: "pointer", display: "flex", alignItems: "baseline", gap: 8 } },
                h("span", null, l.name)))))),
      h("div", { style: { background: "var(--emerald)", color: "var(--bone)", padding: 24, borderRadius: "var(--r-5)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 20 } },
        h("div", null,
          h("div", { style: { fontSize: 17, fontWeight: 700, lineHeight: 1.6 } }, cat.name),
          h("p", { style: { margin: "8px 0 0", fontSize: 14, lineHeight: 1.85, color: "rgb(var(--bone-rgb) / 0.72)" } }, fa.catBlurb[cat.slug] || "")),
        h("button", { class: "j-btn j-btn--bone", onClick: () => A.openCategory(cat.slug),
          style: { padding: "12px 18px", borderRadius: "var(--r-5)", fontSize: "14.5px", fontWeight: 600, alignSelf: "flex-start" } }, fa.nav.allOfCategory))));
}

/* ------------------------------------------------------ header cart dropdown --- */
function cartDropdown(s) {
  const count = cartCount(s.cart);
  const empty = s.cart.items.length === 0;
  return h("div", { class: "km-cartpanel j-dropin", style: {
    position: "absolute", insetBlockStart: "calc(100% + 12px)", insetInlineEnd: 0,
    width: "min(392px, calc(100vw - 32px))", background: "var(--surface)", color: "var(--ink)",
    border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-6)", boxShadow: "var(--shadow-pop)", padding: 20, zIndex: 70,
  } },
    h("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBlockEnd: 14 } },
      h("strong", { style: { fontSize: 16, fontWeight: 700 } }, fa.cartDrawer.title),
      h("span", { style: { fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.55)" } }, toPersianNumber(count) + " " + fa.cartDrawer.unit)),
    empty
      ? h("p", { style: { margin: 0, padding: "22px 0 18px", fontSize: 15, lineHeight: 1.8, color: "rgb(var(--ink-rgb) / 0.62)" } }, fa.cartDrawer.empty)
      : h("div", null,
          h("div", { class: "km-scroll", style: { display: "flex", flexDirection: "column", gap: 14, maxHeight: 260, overflowY: "auto" } },
            s.cart.items.map((l) =>
              h("div", { key: l.product_id, style: { display: "flex", gap: 12, alignItems: "flex-start" } },
                h("img", { src: l.image, alt: "", width: 104, height: 104, loading: "lazy",
                  style: { width: 52, height: 52, flexShrink: 0, objectFit: "cover", objectPosition: l.image_pos || "50% 50%", background: "var(--img-bg)", border: "1px solid rgb(var(--ink-rgb) / 0.08)", borderRadius: "var(--r-3)", display: "block" } }),
                h("div", { style: { flex: 1, minWidth: 0 } },
                  h("div", { style: { fontSize: 14, lineHeight: 1.6 } }, l.name),
                  h("div", { style: { fontSize: 13, color: "rgb(var(--ink-rgb) / 0.55)", marginBlockStart: 3 } }, toPersianNumber(l.qty) + " × " + formatToman(l.unit_price)))))),
          h("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBlock: "16px 14px", marginBlockStart: 14, borderBlockStart: "1px solid rgb(var(--ink-rgb) / 0.1)" } },
            h("span", { style: { fontSize: "14.5px", color: "rgb(var(--ink-rgb) / 0.6)" } }, fa.cartDrawer.subtotal),
            h("strong", { style: { fontSize: 17, fontWeight: 700 } }, formatToman(cartSubtotal(s.cart))))),
    h("button", { class: "j-btn", onClick: A.goCart,
      style: { width: "100%", background: "var(--ink)", color: "var(--surface)", border: "none", padding: 14, borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600, cursor: "pointer" } }, fa.cartDrawer.view));
}

/* -------------------------------------------------------------- mobile nav --- */
export function mobileNav(s) {
  if (!s.mobileNav) return null;
  return h("div", { style: { position: "fixed", inset: 0, zIndex: 80, display: "flex" } },
    h("div", { onClick: A.toggleMobileNav, style: { position: "absolute", inset: 0, background: "rgb(var(--emerald-rgb) / 0.5)" } }),
    h("div", { class: "j-drawer", style: { position: "relative", marginInlineStart: "auto", width: "min(360px, 88vw)", background: "var(--surface)", height: "100%", overflowY: "auto", padding: 24 } },
      h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 20 } },
        h("strong", { style: { fontSize: 17 } }, fa.mobileNav.title),
        h("button", { onClick: A.toggleMobileNav, "aria-label": fa.mobileNav.close, style: { background: "none", border: "1px solid rgb(var(--ink-rgb) / 0.16)", width: 38, height: 38, borderRadius: "var(--r-5)", cursor: "pointer", fontSize: 18, color: "var(--ink)" } }, "×")),
      s.categories.map((c) =>
        h("div", { key: c.slug, style: { borderBlockEnd: "1px solid rgb(var(--ink-rgb) / 0.08)", paddingBlock: 12 } },
          h("button", { onClick: () => A.openCategory(c.slug), style: { background: "none", border: "none", padding: 0, fontSize: 16, fontWeight: 700, color: "var(--emerald)", cursor: "pointer", textAlign: "start" } }, c.name),
          h("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginBlockStart: 10 } },
            (c.children || []).map((sc) =>
              h("button", { key: sc.slug, onClick: () => A.openCategory(c.slug, sc.slug), style: { background: "var(--page)", border: "none", padding: "7px 12px", borderRadius: "var(--r-pill)", fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.75)", cursor: "pointer" } }, sc.name))))),
      h("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBlockStart: 20 } },
        h("button", { onClick: A.focusFinder, style: { display: "flex", alignItems: "center", gap: 10, background: "var(--page)", border: "1px solid rgb(var(--ink-rgb) / 0.14)", color: "rgb(var(--ink-rgb) / 0.72)", padding: "14px 16px", borderRadius: "var(--r-5)", fontSize: 15, cursor: "pointer", textAlign: "start" } },
          icon.ring(15), h("span", null, fa.mobileNav.finder)),
        h("button", { class: "j-btn", onClick: A.goLogin, style: { background: "var(--ink)", color: "var(--surface)", border: "none", padding: 14, borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600, cursor: "pointer" } }, s.loggedIn ? fa.header.account : fa.header.login),
        h("a", { href: telHref(s.settings.contact.phone), style: { border: "1px solid rgb(var(--ink-rgb) / 0.18)", padding: 14, borderRadius: "var(--r-5)", fontSize: 15, textAlign: "center", color: "var(--ink)", textDecoration: "none" } }, fa.mobileNav.call))));
}

/* ------------------------------------------------------------------ footer --- */
export function footer(s) {
  const set = s.settings;
  const social = set.social || {};
  const socialItems = [
    social.telegram && { kind: "telegram", handle: social.telegram },
    social.instagram && { kind: "instagram", handle: social.instagram },
    social.aparat && { kind: "aparat", handle: social.aparat },
    { kind: "whatsapp", href: waHref(set) },
  ].filter(Boolean);

  return h("footer", { style: { background: "var(--emerald)", color: "var(--bone)", marginBlockStart: "auto" } },
    h("div", { class: "km-pad", style: container({ padding: "56px 32px 32px" }) },
      h("div", { class: "km-foot", style: { display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.3fr", gap: 40 } },

        h("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
          h("div", { style: { display: "flex", flexDirection: "column", lineHeight: 1.2 } },
            h("span", { style: { fontSize: 22, fontWeight: 800 } }, fa.brand.name),
            h("span", { style: { fontSize: "12.5px", color: "rgb(var(--bone-rgb) / 0.6)" } }, fa.brand.tagline)),
          h("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.9, color: "rgb(var(--bone-rgb) / 0.7)", maxWidth: "36ch" } }, fa.brand.blurb),
          h("div", { style: { display: "flex", gap: 8 } },
            socialItems.map((it, i) =>
              h("a", { key: i, href: it.href || socialHref(it.kind, it.handle), "aria-label": fa.footer.socialNames[it.kind],
                style: { width: 40, height: 40, border: "1px solid rgb(var(--bone-rgb) / 0.26)", borderRadius: "var(--r-5)", display: "grid", placeItems: "center", color: "var(--bone)", fontSize: "11.5px", fontWeight: 600, textDecoration: "none" } },
                fa.footer.socialShort[it.kind])))),

        fa.footer.columns.map((col, i) =>
          h("div", { key: i },
            h("div", { style: { fontSize: 15, fontWeight: 700, marginBlockEnd: 14 } }, col.name),
            h("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
              (col.kind === "cats" ? s.categories.slice(0, 4).map((c) => ({ label: c.name, action: "cat:" + c.slug })) : col.links).map((l, j) =>
                h("button", { key: j, class: "j-foot-link", onClick: () => A.runAction(l.action), style: { fontSize: 14, lineHeight: 1.6 } }, l.label))))),

        h("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
          h("div", { style: { fontSize: 15, fontWeight: 700 } }, fa.footer.contactHeading),
          h("a", { href: telHref(set.contact.phone), style: { fontSize: 19, fontWeight: 700, color: "var(--bone)", textDecoration: "none", direction: "ltr", unicodeBidi: "plaintext" } }, set.contact.phone),
          h("div", { style: { fontSize: 14, lineHeight: 1.95, color: "rgb(var(--bone-rgb) / 0.72)" } }, set.contact.address),
          h("div", { style: { display: "flex", gap: 10, marginBlockStart: 4 } },
            [fa.footer.enamad, fa.footer.samandehi].map((t, i) =>
              h("span", { key: i, style: { width: 88, height: 64, border: "1px solid rgb(var(--bone-rgb) / 0.24)", borderRadius: "var(--r-4)", display: "grid", placeItems: "center", fontSize: 11, color: "rgb(var(--bone-rgb) / 0.55)", textAlign: "center", lineHeight: 1.5, padding: 6 } }, t))))),

      h("div", { style: { borderBlockStart: "1px solid rgb(var(--bone-rgb) / 0.14)", marginBlockStart: 40, paddingBlockStart: 22, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", fontSize: 13, color: "rgb(var(--bone-rgb) / 0.55)", lineHeight: 1.8 } },
        h("span", null, fa.footer.copyright),
        h("span", null, fa.footer.returnPolicy))));
}

/* ----------------------------------------------------------- whatsapp / toast --- */
export function whatsappFab(s) {
  return h("a", { href: waHref(s.settings), "aria-label": fa.wa.aria, style: {
    position: "fixed", insetBlockEnd: 24, insetInlineEnd: 24, zIndex: 85, width: 56, height: 56, borderRadius: "50%",
    background: "var(--emerald-live)", color: "var(--surface)", display: "grid", placeItems: "center",
    boxShadow: "0 10px 28px rgb(var(--emerald-rgb) / 0.32)", textDecoration: "none", fontSize: "12.5px", fontWeight: 700, lineHeight: 1.3, textAlign: "center",
  } }, fa.wa.label);
}

export function toastLayer(s) {
  return h("div", { "aria-live": "polite", style: { position: "fixed", insetBlockEnd: 24, insetInlineStart: 24, zIndex: 90, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" } },
    s.toast && h("div", { class: "j-toast", style: { background: "var(--ink)", color: "var(--surface)", padding: "14px 20px", borderRadius: "var(--r-5)", fontSize: 15, lineHeight: 1.6, maxWidth: 340, boxShadow: "var(--shadow-pop)" } }, s.toast));
}
