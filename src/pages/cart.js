/* cart.js — line items with stock-bounded stepper + remove, sticky summary
   computed live from unit_price + settings.shipping, and the honest terminal
   card (no online checkout yet). Ports lines 721–789 of the prototype. */

import { h } from "../lib/dom.js";
import fa from "../i18n/fa.js";
import { formatToman, toPersianDigits, parseFaDigits } from "../lib/format.js";
import { telHref, waHref } from "../lib/links.js";
import { letterheadMark } from "../components/ui.js";
import * as A from "../actions.js";

const container = (extra) => Object.assign({ maxWidth: "1280px", margin: "0 auto" }, extra || {});

export function cartPage(s) {
  const items = s.cart.items;
  const count = items.reduce((a, l) => a + l.qty, 0);
  const subtotal = items.reduce((a, l) => a + l.unit_price * l.qty, 0);
  const ship = s.settings.shipping;
  const freeShip = subtotal >= ship.free_over;
  const shipCost = items.length === 0 ? 0 : freeShip ? 0 : ship.cost;
  const total = subtotal + shipCost;

  return h("div", { class: "km-pad", style: container({ padding: "32px 32px 80px" }) },
    h("h1", { style: { margin: "0 0 8px", fontSize: "var(--fs-h1-flat)", fontWeight: 800, letterSpacing: "-0.015em" } }, fa.cart.title),
    h("p", { "aria-live": "polite", style: { margin: "0 0 28px", fontSize: 15, color: "rgb(var(--ink-rgb) / 0.6)", lineHeight: 1.75 } },
      h("span", { key: "cc-" + count, class: "km-note", style: { display: "inline-block" } }, fa.cart.count(count))),

    items.length === 0
      ? h("div", { style: { position: "relative", overflow: "hidden", background: "var(--surface)", border: "1px dashed rgb(var(--ink-rgb) / 0.22)", borderRadius: "var(--r-6)", padding: "64px 32px", textAlign: "center" } },
          letterheadMark(),
          h("strong", { style: { display: "block", fontSize: 21, fontWeight: 700 } }, fa.cart.emptyTitle),
          h("p", { style: { margin: "12px auto 26px", fontSize: "15.5px", lineHeight: 1.9, color: "rgb(var(--ink-rgb) / 0.62)", maxWidth: "48ch" } }, fa.cart.emptyBody),
          h("div", { style: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" } },
            h("button", { class: "j-btn j-btn--ink", onClick: A.goHome, style: { padding: "14px 26px", borderRadius: "var(--r-5)", fontSize: "15.5px", fontWeight: 700 } }, fa.cart.emptyCta),
            h("a", { href: telHref(s.settings.contact.phone), style: { border: "1px solid rgb(var(--ink-rgb) / 0.2)", padding: "14px 26px", borderRadius: "var(--r-5)", fontSize: "15.5px", color: "var(--ink)", textDecoration: "none" } }, fa.cart.emptyCall)))

      : h("div", { class: "km-cartgrid", style: { display: "grid", gridTemplateColumns: "1fr 372px", gap: 32, alignItems: "start" } },
          h("div", { class: "km-stagger", style: { display: "flex", flexDirection: "column", gap: 14 } },
            items.map((l) =>
              h("div", { key: l.product_id, style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.09)", borderRadius: "var(--r-6)", padding: 18, display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" } },
                h("img", { src: l.image, alt: "", width: 208, height: 208, loading: "lazy",
                  style: { width: 104, height: 104, flexShrink: 0, objectFit: "cover", objectPosition: l.image_pos || "50% 50%", background: "var(--img-bg)", border: "1px solid rgb(var(--ink-rgb) / 0.08)", borderRadius: "var(--r-4)", display: "block" } }),
                h("div", { style: { flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 10 } },
                  h("button", { class: "j-link-quiet", onClick: () => A.openProduct(l.slug), style: { textAlign: "start", fontSize: 16, lineHeight: 1.7, fontWeight: 600, color: "var(--ink)", cursor: "pointer" } }, l.name),
                  h("div", { style: { fontSize: 14, color: "rgb(var(--ink-rgb) / 0.58)", lineHeight: 1.7 } }, fa.cart.unitPrice + " " + formatToman(l.unit_price)),
                  h("div", { style: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" } },
                    h("div", { style: { display: "flex", alignItems: "center", border: "1px solid rgb(var(--ink-rgb) / 0.18)", borderRadius: "var(--r-5)", background: "#fff", overflow: "hidden" } },
                      h("button", { class: "j-step", onClick: () => A.setCartQty(l.product_id, l.qty - 1, l.stock), "aria-label": fa.cart.qtyDown, style: lineStep }, "−"),
                      h("input", { type: "text", inputmode: "numeric", "aria-label": fa.cart.qty, value: toPersianDigits(l.qty),
                        onChange: (e) => { const v = +parseFaDigits(e.target.value); if (v) A.setCartQty(l.product_id, v, l.stock); },
                        style: { width: 52, height: 42, border: "none", textAlign: "center", fontSize: 15, fontWeight: 700, color: "var(--ink)", background: "none" } }),
                      h("button", { class: "j-step", onClick: () => A.setCartQty(l.product_id, l.qty + 1, l.stock), "aria-label": fa.cart.qtyUp, style: lineStep }, "+")),
                    h("span", { style: { fontSize: 13, color: "rgb(var(--ink-rgb) / 0.5)" } }, fa.cart.stockHint(l.stock)),
                    h("button", { onClick: () => A.removeCartItem(l.product_id), style: { background: "none", border: "none", padding: 0, fontSize: "13.5px", color: "var(--danger)", cursor: "pointer", marginInlineStart: "auto" } }, fa.cart.remove))),
                h("strong", { style: { fontSize: 18, fontWeight: 800, whiteSpace: "nowrap" } }, formatToman(l.unit_price * l.qty))))),

          h("div", { style: { display: "flex", flexDirection: "column", gap: 16, position: "sticky", insetBlockStart: 160 } },
            h("div", { style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-6)", padding: 24, display: "flex", flexDirection: "column", gap: 14 } },
              h("strong", { style: { fontSize: 17, fontWeight: 700 } }, fa.cart.summaryHeading),
              summaryRow(fa.cart.subtotal, formatToman(subtotal)),
              summaryRow(fa.cart.shipping, items.length === 0 ? fa.cart.dash : freeShip ? fa.cart.free : formatToman(ship.cost)),
              items.length > 0 && !freeShip && h("div", { style: { fontSize: 13, lineHeight: 1.75, color: "var(--warn)", background: "var(--warn-bg)", border: "1px solid var(--warn-border-soft)", borderRadius: "var(--r-4)", padding: "10px 12px" } }, fa.cart.freeShipHint(ship.free_over - subtotal)),
              h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBlockStart: "1px solid rgb(var(--ink-rgb) / 0.12)", paddingBlockStart: 14 } },
                h("span", { style: { fontSize: "15.5px", fontWeight: 600 } }, fa.cart.payable),
                h("strong", { style: { fontSize: 22, fontWeight: 800 } }, formatToman(total)))),

            h("div", { style: { background: "var(--emerald)", color: "var(--bone)", borderRadius: "var(--r-6)", padding: 24, display: "flex", flexDirection: "column", gap: 14 } },
              h("strong", { style: { fontSize: "16.5px", fontWeight: 700, lineHeight: 1.6 } }, fa.cart.terminalTitle),
              h("p", { style: { margin: 0, fontSize: "14.5px", lineHeight: 1.9, color: "rgb(var(--bone-rgb) / 0.78)" } }, fa.cart.terminalBody),
              h("a", { href: waHref(s.settings), style: { background: "var(--bone)", color: "var(--ink)", padding: 15, borderRadius: "var(--r-5)", fontSize: "15.5px", fontWeight: 700, textAlign: "center", textDecoration: "none" } }, fa.cart.terminalWhatsapp),
              h("a", { href: telHref(s.settings.contact.phone), style: { border: "1px solid rgb(var(--bone-rgb) / 0.34)", color: "var(--bone)", padding: 15, borderRadius: "var(--r-5)", fontSize: "15.5px", textAlign: "center", textDecoration: "none", direction: "ltr", unicodeBidi: "plaintext" } }, s.settings.contact.phone)))));
}

const lineStep = { width: 40, height: 42, background: "none", border: "none", fontSize: 18, color: "var(--ink)", cursor: "pointer" };

function summaryRow(label, value) {
  return h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 15, color: "rgb(var(--ink-rgb) / 0.68)" } },
    h("span", null, label),
    h("span", { style: { fontWeight: 600, color: "var(--ink)" } }, value));
}
