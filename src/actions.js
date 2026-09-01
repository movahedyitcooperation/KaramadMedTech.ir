/* actions.js — the controller. Every state transition the prototype's Component
   methods did, now as plain functions over the store + endpoint modules. */

import { getState, setState } from "./lib/state.js";
import { navigate, buildHash } from "./lib/router.js";
import fa from "./i18n/fa.js";
import { parseFaDigits } from "./lib/format.js";
import { isLoggedIn, setToken, clearToken, setSavedContact, getSavedContact } from "./lib/storage.js";
import * as catalog from "./api/endpoints/catalog.js";
import * as cartApi from "./api/endpoints/cart.js";
import * as authApi from "./api/endpoints/auth.js";
import * as accountApi from "./api/endpoints/account.js";
import { clearGuestToken } from "./lib/guest-token.js";
import { ApiError } from "./api/client.js";

/* ---------------- initial state ---------------- */
export const initialState = {
  route: "home", catSlug: null, subSlug: null, productSlug: null, acctTab: "profile",
  sort: "newest", priceMin: "", priceMax: "", brands: [], inStockOnly: false, page: 1,

  categories: [], settings: null, booted: false, bootError: false,
  cart: { id: "guest-cart", items: [] },

  megaCat: null, cartOpen: false, phoneOpen: false, mobileNav: false, filtersOpen: false,
  hero: 0, heroHover: false, toast: "",

  homeNewest: [], homeFeatured: [], homeState: "loading",

  catResult: null, catState: "idle",

  product: null, related: [], pdpState: "loading",
  pdpQty: 1, pdpTab: "review", pdpThumb: 0, pdpStockNote: "",

  loggedIn: isLoggedIn(),
  authStep: "contact", contact: getSavedContact(), code: "", authError: "", authBusy: false, resendIn: 0,

  me: null, addresses: [], acctState: "loading",
  addrFormOpen: false, addrForm: null, addrErrors: {},

  finderCat: "", finderBand: "",
};

/* ---------------- toast ---------------- */
let toastTimer;
export function toast(msg) {
  clearTimeout(toastTimer);
  setState({ toast: msg });
  toastTimer = setTimeout(() => setState({ toast: "" }), 3600);
}

/* ---------------- boot ---------------- */
export async function bootstrap() {
  try {
    const [categories, settings, cart] = await Promise.all([
      catalog.getCategories(), catalog.getSettings(), cartApi.getCart(),
    ]);
    setState({ categories, settings, cart, booted: true });
  } catch (err) {
    console.error("boot failed", err);
    setState({ booted: true, bootError: true });
  }
}

/* ---------------- navigation ---------------- */
export function goHome() { navigate("#/"); }
export function goCart() { navigate("#/cart"); }
export function goLogin() { navigate(getState().loggedIn ? "#/account" : "#/login"); }
export function openProduct(slug) {
  setState({ megaCat: null, cartOpen: false, mobileNav: false });
  navigate("#/p/" + encodeURIComponent(slug));
}
export function openCategory(catSlug, subSlug) {
  setState({ megaCat: null, cartOpen: false, mobileNav: false });
  navigate(buildHash({ route: "category", catSlug, subSlug: subSlug || null, sort: "newest", page: 1, brands: [] }));
}

/** Dispatch for service cards / footer links / mega CTA. */
export function runAction(str) {
  if (!str) return;
  if (str.startsWith("cat:")) return openCategory(str.slice(4));
  if (str === "phone") return setState({ phoneOpen: true });
  if (str.startsWith("toast:")) return toast(fa.toast[str.slice(6)] || "");
}

/* ---------------- route change → data loads ---------------- */
let catAbort = null;

export function onRoute(r) {
  const prev = getState();
  setState({
    route: r.route, catSlug: r.catSlug, subSlug: r.subSlug, productSlug: r.productSlug, acctTab: r.acctTab,
    sort: r.sort, priceMin: r.priceMin, priceMax: r.priceMax, brands: r.brands, inStockOnly: r.inStockOnly, page: r.page,
    megaCat: null, cartOpen: false, mobileNav: false, filtersOpen: false,
  });

  if (r.route === "home") loadHome();
  if (r.route === "category") loadCategory();
  if (r.route === "product" && r.productSlug && (prev.productSlug !== r.productSlug || !prev.product)) {
    setState({ pdpQty: 1, pdpTab: "review", pdpThumb: 0, pdpStockNote: "" });
    loadProduct(r.productSlug);
  }
  if (r.route === "account") { if (!getState().loggedIn) { navigate("#/login", { replace: true }); return; } loadAccount(); }
  if (r.route === "login" && getState().loggedIn) navigate("#/account", { replace: true });
}

export async function loadHome() {
  if (getState().homeState === "ready") return;
  setState({ homeState: "loading" });
  try {
    const [homeNewest, homeFeatured] = await Promise.all([catalog.getNewest(8), catalog.getFeatured()]);
    setState({ homeNewest, homeFeatured, homeState: "ready" });
  } catch (err) {
    console.error(err);
    setState({ homeState: "error" });
  }
}

export async function loadCategory() {
  const s = getState();
  if (catAbort) catAbort.abort();
  catAbort = new AbortController();
  const mySignal = catAbort.signal;
  setState({ catState: "loading" });
  try {
    const result = await catalog.getProducts({
      categorySlug: s.subSlug || s.catSlug,
      priceMin: parseFaDigits(s.priceMin), priceMax: parseFaDigits(s.priceMax),
      brands: s.brands, inStockOnly: s.inStockOnly, sort: s.sort, page: s.page, pageSize: 9,
      signal: mySignal,
    });
    if (mySignal.aborted) return;
    setState({ catResult: result, catState: "ready" });
  } catch (err) {
    if (err && err.name === "AbortError") return;
    console.error(err);
    setState({ catState: "error" });
  }
}

export async function loadProduct(slug) {
  setState({ pdpState: "loading", product: null, related: [] });
  try {
    const product = await catalog.getProduct(slug);
    setState({ product, pdpState: "ready" });
    const related = await catalog.getRelated(product);
    setState({ related });
  } catch (err) {
    console.error(err);
    setState({ pdpState: err instanceof ApiError && err.status === 404 ? "notfound" : "error" });
  }
}

/* ---------------- catalog filters (all via the URL) ---------------- */
function pushFilters(patch) {
  const s = getState();
  navigate(buildHash({
    route: "category", catSlug: s.catSlug, subSlug: s.subSlug,
    sort: s.sort, priceMin: s.priceMin, priceMax: s.priceMax, brands: s.brands, inStockOnly: s.inStockOnly, page: 1,
    ...patch,
  }));
}
export const setSort = (v) => pushFilters({ sort: v });
export const setPriceMin = (v) => pushFilters({ priceMin: parseFaDigits(v) });
export const setPriceMax = (v) => pushFilters({ priceMax: parseFaDigits(v) });
export const toggleBrand = (b) => {
  const brands = getState().brands;
  pushFilters({ brands: brands.includes(b) ? brands.filter((x) => x !== b) : brands.concat([b]) });
};
export const toggleInStock = () => pushFilters({ inStockOnly: !getState().inStockOnly });
export const clearFilters = () => pushFilters({ priceMin: "", priceMax: "", brands: [], inStockOnly: false });
export const gotoPage = (n) => {
  const s = getState();
  navigate(buildHash({ route: "category", catSlug: s.catSlug, subSlug: s.subSlug, sort: s.sort, priceMin: s.priceMin, priceMax: s.priceMax, brands: s.brands, inStockOnly: s.inStockOnly, page: n }));
  window.scrollTo(0, 0);
};

/* ---------------- hero ---------------- */
export const heroGoto = (i) => setState({ hero: i });
export function heroPrev() {
  const n = getState().settings.hero_slides.length;
  setState((s) => ({ hero: (s.hero + n - 1) % n }));
}
export function heroNext() {
  const n = getState().settings.hero_slides.length;
  setState((s) => ({ hero: (s.hero + 1) % n }));
}
export const heroHoverOn = () => setState({ heroHover: true });
export const heroHoverOff = () => setState({ heroHover: false });
export function heroTick() {
  const s = getState();
  if (s.route !== "home" || s.heroHover || !s.settings) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const n = s.settings.hero_slides.length;
  setState({ hero: (s.hero + 1) % n });
}

/* ---------------- header / panels ---------------- */
export const toggleMega = (slug) => setState((s) => ({ megaCat: s.megaCat === slug ? null : slug }));
export const hoverMega = (slug) => setState({ megaCat: slug });
export const closeMega = () => setState({ megaCat: null });
export const toggleCart = () => setState((s) => ({ cartOpen: !s.cartOpen, phoneOpen: false }));
export const toggleMobileNav = () => setState((s) => ({ mobileNav: !s.mobileNav }));
export const togglePhone = () => setState((s) => ({ phoneOpen: !s.phoneOpen }));
export const toggleFilters = () => setState((s) => ({ filtersOpen: !s.filtersOpen }));
export function closeOverlays() { setState({ megaCat: null, cartOpen: false, mobileNav: false, filtersOpen: false }); }

/* ---------------- cart ---------------- */
export async function addToCart(product, qty = 1) {
  if (product.stock === 0) { toast(fa.toast.addOutOfStock); return; }
  const before = (getState().cart.items.find((l) => l.product_id === product.id) || {}).qty || 0;
  const want = Math.max(1, qty);
  try {
    const cart = await cartApi.addItem(product.id, want);
    const after = (cart.items.find((l) => l.product_id === product.id) || {}).qty || 0;
    setState({ cart });
    if (after - before < want) toast(fa.toast.addClamped(product.stock));
    else toast(fa.toast.added(product.name));
  } catch (err) { console.error(err); toast(fa.login.errors.network); }
}

export async function setCartQty(productId, qty, stock) {
  const clamped = Math.max(1, Math.min(qty, stock));
  const cart = await cartApi.setItem(productId, qty);
  setState({ cart });
  if (clamped !== qty) toast(fa.toast.setQtyClamped(stock));
}

export async function removeCartItem(productId) {
  const cart = await cartApi.removeItem(productId);
  setState({ cart });
  toast(fa.toast.removed);
}

/* ---------------- finder (home) ---------------- */
export const setFinderCat = (v) => setState({ finderCat: v });
export const setFinderBand = (v) => setState({ finderBand: v });
export const setFinderSort = (v) => setState({ sort: v });
export function finderGo() {
  const s = getState();
  const band = s.finderBand ? s.finderBand.split("-") : ["", ""];
  navigate(buildHash({
    route: "category",
    catSlug: s.finderCat || "diagnostics",
    subSlug: null,
    sort: s.sort,
    priceMin: band[0] === "0" ? "" : band[0],
    priceMax: band[1] === "0" ? "" : band[1],
    brands: [], inStockOnly: false, page: 1,
  }));
}
export function focusFinder() {
  navigate("#/");
  setTimeout(() => {
    const el = document.querySelector('[data-finder]');
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo(0, Math.max(0, y));
      const sel = el.querySelector("select");
      if (sel) sel.focus();
    }
  }, 80);
}

/* ---------------- PDP ---------------- */
export const setPdpTab = (id) => setState({ pdpTab: id });
export const setPdpThumb = (i) => setState({ pdpThumb: i });
export function pdpQtyUp() {
  const s = getState();
  if (!s.product) return;
  if (s.pdpQty + 1 > s.product.stock) { setState({ pdpStockNote: fa.pdp.qtyMaxNote(s.product.stock) }); return; }
  setState({ pdpQty: s.pdpQty + 1, pdpStockNote: "" });
}
export function pdpQtyDown() {
  setState((s) => ({ pdpQty: Math.max(1, s.pdpQty - 1), pdpStockNote: "" }));
}
export function pdpQtySet(raw) {
  const s = getState();
  if (!s.product) return;
  const v = +parseFaDigits(raw) || 1;
  const clamped = Math.max(1, Math.min(v, Math.max(s.product.stock, 1)));
  setState({ pdpQty: clamped, pdpStockNote: clamped !== v ? fa.pdp.qtyClampNote(s.product.stock) : "" });
}
export function pdpAdd() {
  const s = getState();
  if (s.product) addToCart(s.product, s.pdpQty);
}
export function pdpShare() {
  try { navigator.clipboard.writeText(location.href); } catch { /* ignore */ }
  toast(fa.pdp.shared);
}

/* ---------------- auth ---------------- */
export const setContact = (v) => setState({ contact: v, authError: "" });
export const setCode = (v) => setState({ code: v, authError: "" });
export const editContact = () => setState({ authStep: "contact", authError: "", code: "" });

function otpMessage(err) {
  if (!(err instanceof ApiError)) return fa.login.errors.generic;
  if (err.code === "network_error") return fa.login.errors.network;
  const m = fa.login.errors[err.code];
  if (typeof m === "function") return m(err.attemptsLeft ?? 0);
  return m || fa.login.errors.generic;
}

export async function requestOtp() {
  const s = getState();
  setState({ authBusy: true, authError: "" });
  try {
    const res = await authApi.requestOtp(s.contact.trim());
    setSavedContact(res.contact);
    setState({ authBusy: false, authStep: "code", resendIn: res.expires_in || authApi.RESEND_COOLDOWN, code: "", contact: res.contact });
  } catch (err) {
    setState({ authBusy: false, authError: otpMessage(err) });
  }
}

export async function resendOtp() {
  const s = getState();
  if (s.resendIn > 0) { setState({ authError: fa.login.errors.otp_resend_too_soon }); return; }
  try {
    const res = await authApi.resendOtp(s.contact.trim());
    setState({ resendIn: res.expires_in || authApi.RESEND_COOLDOWN, authError: "" });
    toast(fa.login.resentToast);
  } catch (err) {
    setState({ authError: otpMessage(err) });
  }
}

export async function verifyOtp() {
  const s = getState();
  const code = parseFaDigits(s.code);
  if (code.length !== 6) { setState({ authError: fa.login.codeShort(6 - code.length) }); return; }
  setState({ authBusy: true, authError: "" });
  try {
    const res = await authApi.verifyOtp(s.contact.trim(), code);
    setToken(res.access_token);
    if (res.cart) setState({ cart: res.cart });
    setState({ authBusy: false, loggedIn: true, authError: "", code: "" });
    navigate("#/account");
    toast(fa.login.welcomeToast);
  } catch (err) {
    setState({ authBusy: false, authError: otpMessage(err) });
  }
}

export function resendTick() {
  setState((s) => (s.resendIn > 0 ? { resendIn: s.resendIn - 1 } : null));
}

/* ---------------- account ---------------- */
export const setAcctTab = (id) => navigate(buildHash({ route: "account", acctTab: id }));

export async function loadAccount() {
  if (getState().acctState === "ready") return;
  setState({ acctState: "loading" });
  try {
    const [me, addresses] = await Promise.all([accountApi.getMe(), accountApi.getAddresses()]);
    setState({ me, addresses, acctState: "ready" });
  } catch (err) {
    console.error(err);
    setState({ acctState: "error" });
  }
}

export async function saveProfile(fullName) {
  const me = await accountApi.updateMe({ full_name: fullName });
  setState({ me });
  toast(fa.account.savedNameToast);
}

export const openAddrForm = () => setState({
  addrFormOpen: true, addrErrors: {},
  addrForm: { title: "", full_name: "", phone: "", province: "", city: "", address_line: "", postal_code: "", is_default: false },
});
export const closeAddrForm = () => setState({ addrFormOpen: false, addrForm: null, addrErrors: {} });
export const setAddrField = (k, v) => setState((s) => ({ addrForm: { ...s.addrForm, [k]: v }, addrErrors: { ...s.addrErrors, [k]: "" } }));

export async function submitAddr() {
  const f = getState().addrForm;
  const errs = {};
  for (const k of ["title", "full_name", "phone", "province", "city", "address_line"]) {
    if (!String(f[k] || "").trim()) errs[k] = fa.account.addrForm.required;
  }
  if (!errs.phone && !/^09\d{9}$/.test(parseFaDigits(f.phone))) errs.phone = fa.account.addrForm.phoneInvalid;
  if (Object.keys(errs).length) { setState({ addrErrors: errs }); return; }
  const addresses = await accountApi.createAddress({
    ...f, phone: parseFaDigits(f.phone), postal_code: parseFaDigits(f.postal_code) || undefined,
  });
  setState({ addresses, addrFormOpen: false, addrForm: null, addrErrors: {} });
  toast(fa.account.addrForm.savedToast);
}

export async function removeAddr(id) {
  const addresses = await accountApi.deleteAddress(id);
  setState({ addresses });
  toast(fa.account.removedAddressToast);
}
export async function makeDefaultAddr(id) {
  const addresses = await accountApi.updateAddress(id, { is_default: true });
  setState({ addresses });
  toast(fa.account.madeDefaultToast);
}

export function logout() {
  clearToken();
  clearGuestToken();
  accountApi.clearAccountCache();
  setState({ loggedIn: false, me: null, addresses: [], acctState: "loading", authStep: "contact", contact: "", code: "" });
  navigate("#/");
  toast(fa.account.loggedOutToast);
}
