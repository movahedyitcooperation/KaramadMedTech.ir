# تجهیزات پزشکی کارآمد — storefront frontend

Persian-first (RTL), vanilla-JavaScript storefront. **No framework, no build step.**
This is the shipping port of the `KaramadMedTech.dc.html` Design Component
(`DESIGN.md` §9): the React/dc-runtime prototype rebuilt as ES modules, the
fixture kept behind an API seam so the real FastAPI backend drops in unchanged.

## Run it

```bash
cd frontend
npm run dev          # → http://localhost:4321  (zero-dependency static server)
```

Any static server works — there is nothing to compile. `server.mjs` only adds a
per-restart `?b=<id>` stamp to module URLs so the browser's ES-module cache
doesn't go stale during development; a plain `npx http-server` / `python -m http.server`
serves the same files.

```bash
npm test             # lib/format.js unit tests (node --test, no runner dep)
npm run sitemap      # regenerate public/sitemap.xml
```

## How data flows

Everything network goes through **`src/api/client.js`** — base URL, `Authorization`
injection, `X-Guest-Cart-Token` injection, JSON parsing, all three FastAPI
error-detail shapes (`detail` string / `{code}` object / Pydantic `detail[]`),
timeout and `AbortController`.

By default the app runs on the **bundled fixture** (`src/api/fixture.js`) — the
same catalog the prototype shipped, shaped like the API contract (master prompt
§4). To point at the live backend:

```
http://localhost:4321/?live=1          # or set window.__KM_LIVE__ = true
```

…and set `API_BASE` in `client.js` (default `/api/v1`). The endpoint modules
(`src/api/endpoints/{catalog,cart,auth,account}.js`) already speak the real
routes — trailing slashes on collections, `sort` enum, repeated `brands=`,
`X-Guest-Cart-Token`, `guest_cart_token` on verify-otp. Nothing else changes.

In fixture mode the OTP demo code is **`123456`** (surfaced in the login card).

## Project layout

```
index.html                  <html lang="fa" dir="rtl">, preloads, critical CSS, JSON-LD
src/
  main.js                   boot: state → render loop → router → timers
  app.js                    shell + active page composition
  actions.js                the controller — every state transition
  api/
    client.js               the one fetch wrapper (+ USE_LIVE_API flag)
    fixture.js               catalog/settings, API-contract shaped
    endpoints/               catalog · cart · auth · account
  lib/
    dom.js                  ~140-line hyperscript + keyed reconciler (replaces React)
    state.js                module store, subscribe/notify (replaces Zustand)
    format.js (+ .test.js)  toPersianDigits / formatToman / formatJalali / parseFaDigits
    router.js               hash router — all catalog filter state lives in the URL
    storage.js              localStorage token  (tradeoff documented in DESIGN.md §1.3)
    guest-token.js          browser-minted X-Guest-Cart-Token
    links.js                tel: / wa.me / social hrefs from settings
    seo.js                  per-route <title>, meta, canonical, Product + BreadcrumbList JSON-LD
  i18n/fa.js                every user-facing Persian string (nothing hardcoded elsewhere)
  styles/
    tokens.css              the only file with hex — 6 palette tokens + type/space scale
    base.css                reset, @font-face, keyframes, responsive rules
    app.css                 interactive states (the prototype's style-hover, now real :hover)
  components/  shell.js · ui.js · cat-glyph.js
  pages/       home · category · product · cart · login · account
  assets/      fonts (self-hosted Vazirmatn woff2) · hero/ · products/
public/        robots.txt · sitemap.xml
```

## Routes

| hash | screen |
|---|---|
| `#/` | home — hero slider, finder, category cards, two carousels, services, trust |
| `#/c/<cat>[/<sub>]?sort=&price_min=&price_max=&brands=a,b&in_stock=1&page=2` | category |
| `#/p/<slug>` | product detail — gallery, purchase card, 3 tabs, related |
| `#/cart` | cart — stock-bounded steppers, live summary, honest terminal card |
| `#/login` | OTP login (phone *or* email), 120s resend countdown |
| `#/account[/<tab>]` | profile / addresses (incl. add-address form) / orders empty state |

## What's inherited from the backend gaps

See `BACKEND-GAPS.md`. In short: no text search (the slot is a category+price
*finder*), no checkout (the funnel ends honestly at the cart), no brands endpoint
(facet derived from the result set), no review submission (نظرات is a designed
empty state), `is_featured` filtered client-side.

## Deploy

Static hosting. Serve `frontend/` as the web root; map `/robots.txt` and
`/sitemap.xml` from `public/`. Proxy `/api/` to the FastAPI backend
(`127.0.0.1:8000`) and set `USE_LIVE_API`. The deploy origin must match the
backend's `FRONTEND_ORIGIN` exactly (single-origin CORS).

### Still open for the shipping build (DESIGN.md §9)

- `pyftsubset` the Vazirmatn woff2 to the glyphs actually used (currently full webfont, ~50 KB/weight)
- real `srcset`/`sizes` per breakpoint — blocked on the backend image pipeline (BACKEND-GAPS)
- `sessionStorage` list caching with a short TTL for instant back-navigation
- prefetch product detail on card hover / viewport entry (respecting `saveData`)
- history routing + server rewrites if hash URLs aren't wanted (sitemap switches to real paths then)
- measured Lighthouse run on throttled mobile
