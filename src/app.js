/* app.js — compose the shell around the active page. */

import { h } from "./lib/dom.js";
import { getState } from "./lib/state.js";
import fa from "./i18n/fa.js";
import { header, mobileNav, footer, whatsappFab, toastLayer } from "./components/shell.js";
import { homePage } from "./pages/home.js";
import { categoryPage } from "./pages/category.js";
import { productPage } from "./pages/product.js";
import { cartPage } from "./pages/cart.js";
import { loginPage } from "./pages/login.js";
import { accountPage } from "./pages/account.js";

function bootScreen() {
  return h("div", { style: { minHeight: "100vh", background: "var(--emerald)", display: "grid", placeItems: "center" } },
    h("div", { style: { width: 120, height: 3, background: "rgb(var(--bone-rgb) / 0.2)", borderRadius: "var(--r-pill)", overflow: "hidden" } },
      h("div", { style: { width: "40%", height: "100%", background: "var(--bone)", animation: "kmIn 1s ease infinite alternate" } })));
}

function bootErrorScreen() {
  return h("div", { lang: "fa", dir: "rtl", style: { minHeight: "100vh", background: "var(--page)", display: "grid", placeItems: "center", padding: 24 } },
    h("div", { style: { maxWidth: "42ch", textAlign: "center" } },
      h("strong", { style: { display: "block", fontSize: 20, fontWeight: 800, color: "var(--ink)" } }, fa.category.loadErrorTitle),
      h("p", { style: { margin: "12px 0 20px", fontSize: 15, lineHeight: 1.9, color: "rgb(var(--ink-rgb) / 0.62)" } }, fa.category.loadErrorBody),
      h("button", { class: "j-btn j-btn--ink", onClick: () => location.reload(), style: { padding: "13px 26px", borderRadius: "var(--r-5)", fontSize: 15, fontWeight: 600 } }, fa.category.retry)));
}

export function renderApp() {
  const s = getState();
  if (!s.booted) return bootScreen();
  if (s.bootError || !s.settings || !s.categories.length) return bootErrorScreen();

  let page;
  switch (s.route) {
    case "category": page = categoryPage(s); break;
    case "product": page = productPage(s); break;
    case "cart": page = cartPage(s); break;
    case "login": page = loginPage(s); break;
    case "account": page = accountPage(s); break;
    default: page = homePage(s);
  }

  return h("div", { lang: "fa", dir: "rtl", style: { minHeight: "100vh", background: "var(--page)", display: "flex", flexDirection: "column" } },
    toastLayer(s),
    whatsappFab(s),
    header(s),
    mobileNav(s),
    h("main", { style: { flex: 1 } }, page),
    footer(s));
}
