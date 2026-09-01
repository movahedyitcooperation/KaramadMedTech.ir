/* account.js — profile (full_name editable only), addresses CRUD incl. the
   add-address form, orders designed empty state. Ports lines 830–896 of the
   prototype; the add-address form is the shipping-build item from DESIGN.md §9. */

import { h } from "../lib/dom.js";
import fa from "../i18n/fa.js";
import { toPersianDigits } from "../lib/format.js";
import { letterheadMark } from "../components/ui.js";
import * as A from "../actions.js";

const container = (extra) => Object.assign({ maxWidth: "1280px", margin: "0 auto" }, extra || {});

export function accountPage(s) {
  return h("div", { class: "km-pad", style: container({ padding: "32px 32px 88px" }) },
    h("h1", { style: { margin: "0 0 28px", fontSize: 31, fontWeight: 800, letterSpacing: "-0.015em" } }, fa.account.title),
    h("div", { class: "km-acct", style: { display: "grid", gridTemplateColumns: "236px 1fr", gap: 32, alignItems: "start" } },
      sideNav(s),
      h("div", null,
        s.acctState === "loading" ? loading()
          : s.acctTab === "profile" ? profile(s)
          : s.acctTab === "addresses" ? addresses(s)
          : ordersEmpty())));
}

function sideNav(s) {
  return h("nav", { "aria-label": fa.account.navAria, style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.09)", borderRadius: "var(--r-6)", padding: 12, display: "flex", flexDirection: "column", gap: 2 } },
    fa.account.tabs.map((t) => {
      const on = s.acctTab === t.id;
      return h("button", { key: t.id, onClick: () => A.setAcctTab(t.id), "aria-current": on ? "true" : "false",
        style: { background: on ? "var(--emerald)" : "transparent", border: "none", padding: "13px 15px", borderRadius: "var(--r-5)", textAlign: "start", fontSize: 15, fontWeight: on ? 700 : 500, color: on ? "var(--bone)" : "rgb(var(--ink-rgb) / 0.75)", cursor: "pointer" } }, t.label);
    }),
    h("button", { onClick: A.logout, style: { background: "none", border: "none", padding: "13px 15px", borderRadius: "var(--r-5)", textAlign: "start", fontSize: "14.5px", color: "var(--danger)", cursor: "pointer", marginBlockStart: 8, borderBlockStart: "1px solid rgb(var(--ink-rgb) / 0.08)" } }, fa.account.logout));
}

function loading() {
  return h("div", { class: "km-shimmer", style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-6)", padding: 26, display: "flex", flexDirection: "column", gap: 16 } },
    h("div", { style: { height: 20, width: "40%", background: "rgb(var(--ink-rgb) / 0.08)", borderRadius: "var(--r-2)" } }),
    h("div", { style: { height: 48, background: "rgb(var(--ink-rgb) / 0.06)", borderRadius: "var(--r-5)" } }),
    h("div", { style: { height: 48, background: "rgb(var(--ink-rgb) / 0.06)", borderRadius: "var(--r-5)" } }));
}

/* --------------------------------------------------------- profile --- */
function profile(s) {
  const me = s.me || {};
  return h("div", { style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-6)", padding: 26, maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 } },
    h("strong", { style: { fontSize: 18, fontWeight: 700 } }, fa.account.profileHeading),
    h("label", { style: { display: "flex", flexDirection: "column", gap: 9, fontSize: 14, color: "rgb(var(--ink-rgb) / 0.7)" } },
      fa.account.fullName,
      h("input", { type: "text", value: me.full_name || "", id: "acct-fullname",
        onKeyDown: (ev) => { if (ev.key === "Enter") { ev.preventDefault(); A.saveProfile(ev.target.value); } },
        style: { padding: 14, border: "1px solid rgb(var(--ink-rgb) / 0.18)", borderRadius: "var(--r-5)", background: "#fff", fontSize: 16, color: "var(--ink)" } })),
    h("div", { class: "km-g4", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } },
      readonlyField(fa.account.phone, me.phone || "—"),
      readonlyField(fa.account.email, me.email || "—")),
    h("p", { style: { margin: 0, fontSize: "12.5px", lineHeight: 1.85, color: "rgb(var(--ink-rgb) / 0.5)" } }, fa.account.identityNote),
    h("button", { class: "j-btn j-btn--ink", onClick: () => { const el = document.getElementById("acct-fullname"); A.saveProfile((el && el.value) || me.full_name || ""); },
      style: { alignSelf: "flex-start", padding: "15px 30px", borderRadius: "var(--r-5)", fontSize: "15.5px", fontWeight: 700 } }, fa.account.saveName));
}
function readonlyField(label, value) {
  return h("div", { style: { display: "flex", flexDirection: "column", gap: 7 } },
    h("span", { style: { fontSize: 14, color: "rgb(var(--ink-rgb) / 0.55)" } }, label),
    h("span", { style: { fontSize: 16, fontWeight: 600, direction: "ltr" } }, value));
}

/* -------------------------------------------------------- addresses --- */
function addresses(s) {
  return h("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
    s.addresses.map((a) =>
      h("div", { key: a.id, style: { background: "var(--surface)", border: "1px solid " + (a.is_default ? "rgb(var(--emerald-rgb) / 0.34)" : "rgb(var(--ink-rgb) / 0.09)"), borderRadius: "var(--r-6)", padding: 22, display: "flex", flexDirection: "column", gap: 10 } },
        h("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
          h("strong", { style: { fontSize: "16.5px", fontWeight: 700 } }, a.title),
          a.is_default && h("span", { style: { fontSize: 12, fontWeight: 700, background: "var(--emerald)", color: "var(--bone)", padding: "4px 10px", borderRadius: "var(--r-2)" } }, fa.account.defaultBadge),
          h("button", { onClick: () => A.removeAddr(a.id), style: { background: "none", border: "none", padding: 0, fontSize: "13.5px", color: "var(--danger)", cursor: "pointer", marginInlineStart: "auto" } }, fa.account.removeAddress)),
        h("div", { style: { fontSize: 15, lineHeight: 1.9, color: "rgb(var(--ink-rgb) / 0.75)" } }, a.province + "، " + a.city + "، " + a.address_line),
        h("div", { style: { fontSize: 14, color: "rgb(var(--ink-rgb) / 0.55)", lineHeight: 1.8 } },
          a.full_name + " — ", h("span", { style: { direction: "ltr", display: "inline-block" } }, toPersianDigits(a.phone)),
          a.postal_code ? [" — " + fa.account.postalLabel + " ", h("span", { style: { direction: "ltr", display: "inline-block" } }, toPersianDigits(a.postal_code))] : ""),
        !a.is_default && h("button", { class: "j-pill-quiet", onClick: () => A.makeDefaultAddr(a.id), style: { alignSelf: "flex-start", padding: "9px 16px", borderRadius: "var(--r-5)", fontSize: "13.5px", cursor: "pointer" } }, fa.account.makeDefault))),

    s.addrFormOpen ? addrForm(s)
      : h("button", { onClick: A.openAddrForm, class: "j-pill-quiet",
          style: { background: "none", border: "1px dashed rgb(var(--ink-rgb) / 0.28)", padding: 18, borderRadius: "var(--r-6)", fontSize: 15, fontWeight: 600, color: "var(--emerald)", cursor: "pointer" } }, fa.account.addAddress));
}

function addrForm(s) {
  const f = s.addrForm; const e = s.addrErrors;
  const F = fa.account.addrForm;
  const inp = (key, label, opts = {}) =>
    h("label", { style: { display: "flex", flexDirection: "column", gap: 7, fontSize: 14, color: "rgb(var(--ink-rgb) / 0.7)" } },
      label,
      h("input", { type: "text", inputmode: opts.numeric ? "numeric" : undefined, value: f[key] || "", placeholder: opts.placeholder || "",
        onChange: (ev) => A.setAddrField(key, ev.target.value),
        style: { padding: 13, border: "1px solid " + (e[key] ? "var(--danger)" : "rgb(var(--ink-rgb) / 0.18)"), borderRadius: "var(--r-5)", background: "#fff", fontSize: 15, color: "var(--ink)", direction: opts.ltr ? "ltr" : "rtl" } }),
      e[key] && h("span", { style: { fontSize: "12.5px", color: "var(--danger)" } }, e[key]));

  return h("form", { onSubmit: (ev) => { ev.preventDefault(); A.submitAddr(); },
    style: { background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-6)", padding: 24, display: "flex", flexDirection: "column", gap: 16 } },
    inp("title", F.title, { placeholder: F.titlePlaceholder }),
    h("div", { class: "km-g4", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
      inp("full_name", F.fullName),
      inp("phone", F.phone, { numeric: true, ltr: true, placeholder: "۰۹۱۲۳۴۵۶۷۸۹" })),
    h("div", { class: "km-g4", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
      inp("province", F.province),
      inp("city", F.city)),
    inp("address_line", F.line, { placeholder: F.linePlaceholder }),
    inp("postal_code", F.postal, { numeric: true, ltr: true }),
    h("label", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" } },
      h("input", { type: "checkbox", checked: !!f.is_default, onChange: (ev) => A.setAddrField("is_default", ev.target.checked), style: { width: 17, height: 17, accentColor: "var(--emerald)" } }),
      h("span", null, F.isDefault)),
    h("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
      h("button", { type: "submit", class: "j-btn j-btn--ink", style: { padding: "13px 26px", borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 700 } }, F.save),
      h("button", { type: "button", class: "j-pill-quiet", onClick: A.closeAddrForm, style: { padding: "13px 24px", borderRadius: "var(--r-5)", fontSize: 15, cursor: "pointer" } }, F.cancel)));
}

/* ----------------------------------------------------------- orders --- */
function ordersEmpty() {
  return h("div", { style: { position: "relative", overflow: "hidden", background: "var(--surface)", border: "1px dashed rgb(var(--ink-rgb) / 0.22)", borderRadius: "var(--r-6)", padding: "56px 32px", textAlign: "center" } },
    letterheadMark(),
    h("strong", { style: { display: "block", fontSize: 20, fontWeight: 700 } }, fa.account.ordersEmptyTitle),
    h("p", { style: { margin: "12px auto 24px", fontSize: 15, lineHeight: 1.9, color: "rgb(var(--ink-rgb) / 0.62)", maxWidth: "50ch" } }, fa.account.ordersEmptyBody),
    h("button", { class: "j-btn j-btn--ink", onClick: A.goHome, style: { padding: "13px 26px", borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600 } }, fa.account.ordersEmptyCta));
}
