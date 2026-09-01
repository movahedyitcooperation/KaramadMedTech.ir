/* login.js — one card, phone OR email, then the 6-digit code step with a 120s
   resend countdown and an edit-contact link. Ports lines 791–828 of the prototype. */

import { h } from "../lib/dom.js";
import fa from "../i18n/fa.js";
import { toPersianDigits } from "../lib/format.js";
import { USE_LIVE_API } from "../api/client.js";
import { DEMO_CODE } from "../api/endpoints/auth.js";
import * as A from "../actions.js";

const container = (extra) => Object.assign({ maxWidth: "1280px", margin: "0 auto" }, extra || {});

function mmss(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return toPersianDigits(m + ":" + s);
}

export function loginPage(s) {
  return h("div", { class: "km-pad", style: container({ padding: "56px 32px 96px", display: "grid", placeItems: "center" }) },
    h("div", { style: { width: "100%", maxWidth: 452, background: "var(--surface)", border: "1px solid rgb(var(--ink-rgb) / 0.1)", borderRadius: "var(--r-7)", padding: 34, overflow: "hidden" } },
      // keyed by step: contact → code settles in as its own beat.
      h("div", { key: s.authStep, class: "km-note" },
        s.authStep === "contact" ? contactStep(s) : codeStep(s))));
}

function contactStep(s) {
  const bad = s.authError && s.authStep === "contact";
  return h("div", null,
    h("h1", { style: { margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: "-0.012em" } }, fa.login.contactTitle),
    h("p", { style: { margin: "12px 0 26px", fontSize: 15, lineHeight: 1.9, color: "rgb(var(--ink-rgb) / 0.65)" } }, fa.login.contactBody),
    h("label", { style: { display: "flex", flexDirection: "column", gap: 9, fontSize: 14, color: "rgb(var(--ink-rgb) / 0.7)" } },
      fa.login.contactLabel,
      h("input", { type: "text", value: s.contact, onChange: (e) => A.setContact(e.target.value), autocomplete: "username", placeholder: fa.login.contactPlaceholder,
        onKeyDown: (e) => { if (e.key === "Enter") A.requestOtp(); },
        style: { padding: 15, border: "1px solid " + (bad ? "var(--danger)" : "rgb(var(--ink-rgb) / 0.18)"), borderRadius: "var(--r-5)", background: "#fff", fontSize: 16, color: "var(--ink)", direction: "ltr", textAlign: "start" } })),
    h("div", { "aria-live": "polite", style: { minHeight: 22, paddingBlockStart: 8, fontSize: "13.5px", lineHeight: 1.7, color: "var(--danger)" } },
      bad ? h("span", { key: s.authError, class: "km-note" }, s.authError) : ""),
    h("button", { class: "j-btn j-btn--ink", onClick: A.requestOtp, disabled: s.authBusy,
      style: { width: "100%", padding: 16, borderRadius: "var(--r-5)", fontSize: 16, fontWeight: 700, marginBlockStart: 8 } }, s.authBusy ? fa.login.requesting : fa.login.request),
    h("p", { style: { margin: "18px 0 0", fontSize: "12.5px", lineHeight: 1.85, color: "rgb(var(--ink-rgb) / 0.5)" } }, fa.login.twoIdentities),
    !USE_LIVE_API && h("p", { style: { margin: "10px 0 0", fontSize: "12.5px", lineHeight: 1.85, color: "var(--warn)" } }, fa.login.demoHint(DEMO_CODE)));
}

function codeStep(s) {
  const bad = s.authError && s.authStep === "code";
  return h("div", null,
    h("h1", { style: { margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: "-0.012em" } }, fa.login.codeTitle),
    h("p", { style: { margin: "12px 0 6px", fontSize: 15, lineHeight: 1.9, color: "rgb(var(--ink-rgb) / 0.65)" } },
      fa.login.codeSentToPre, h("span", { style: { direction: "ltr", display: "inline-block", fontWeight: 700, color: "var(--ink)" } }, s.contact), fa.login.codeSentToPost),
    h("button", { class: "j-link-quiet", onClick: A.editContact, style: { fontSize: "13.5px", color: "var(--emerald)", cursor: "pointer", marginBlockEnd: 24 } }, fa.login.editContact),
    h("label", { style: { display: "flex", flexDirection: "column", gap: 9, fontSize: 14, color: "rgb(var(--ink-rgb) / 0.7)" } },
      fa.login.codeLabel,
      h("input", { type: "text", inputmode: "numeric", autocomplete: "one-time-code", maxlength: 6, value: s.code, onChange: (e) => A.setCode(e.target.value),
        onKeyDown: (e) => { if (e.key === "Enter") A.verifyOtp(); },
        placeholder: "------",
        style: { padding: 15, border: "1px solid " + (bad ? "var(--danger)" : "rgb(var(--ink-rgb) / 0.18)"), borderRadius: "var(--r-5)", background: "#fff", fontSize: 23, fontWeight: 700, letterSpacing: "0.42em", textAlign: "center", color: "var(--ink)", direction: "ltr" } })),
    h("div", { "aria-live": "assertive", style: { minHeight: 22, paddingBlockStart: 8, fontSize: "13.5px", lineHeight: 1.7, color: "var(--danger)" } },
      bad ? h("span", { key: s.authError, class: "km-note" }, s.authError) : ""),
    h("button", { class: "j-btn j-btn--ink", onClick: A.verifyOtp, disabled: s.authBusy,
      style: { width: "100%", padding: 16, borderRadius: "var(--r-5)", fontSize: 16, fontWeight: 700, marginBlockStart: 8 } }, fa.login.verify),
    h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBlockStart: 18, fontSize: "13.5px", color: "rgb(var(--ink-rgb) / 0.6)" } },
      h("span", null, s.resendIn > 0 ? fa.login.resendIn(mmss(s.resendIn)) : fa.login.resendPrompt),
      h("button", { onClick: A.resendOtp, disabled: s.resendIn > 0,
        style: { background: "none", border: "none", padding: 0, fontSize: "13.5px", fontWeight: 600, color: s.resendIn > 0 ? "rgb(var(--ink-rgb) / 0.35)" : "var(--emerald)", cursor: s.resendIn > 0 ? "not-allowed" : "pointer" } }, fa.login.resend)));
}
