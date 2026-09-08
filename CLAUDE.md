# CLAUDE.md — Medical Supplies E-Commerce (Persian / RTL)

> This file is read automatically by Claude Code at the start of every session.
> It is the single source of truth for stack, conventions and design tokens.
> Keep it updated as decisions change.

---

## 1. Project

**Shop name:** تجهیزات پزشکی کارآمد
**Latin / brand:** Karamad MedTech
**Domain:** `karamadmedtech.ir`

A production e-commerce storefront for a **medical supplies business** in Iran.
Audience: clinics, pharmacies, home-care buyers, and individuals.
Language: **Persian only, full RTL**. Currency: **تومان**. Dates: **Jalali (Shamsi)**.

Visual reference (historical): 10 screenshots of `iprojector.ir` at the repo
root (`./reference design.png` … `design10.png` — not `docs/references/`,
which doesn't exist). The storefront reused that site's layout and
information architecture in its first build, not its colors. **Superseded
by §3**: the site's current visual identity is a full design port from a
coworker's redesign (emerald/ink/almond palette, department color-coding,
plain-CSS motion system) — §3 is the actual source of truth now.

## 2. Stack (fixed — do not substitute)

**Split-service architecture as of the `backend/` scaffold:** the storefront
is a Next.js frontend that talks to a **separate Python/FastAPI backend**
(this repo's `backend/` directory) over a JSON REST API at `/api/v1/*`,
rather than Next.js owning the database directly via Prisma/Server Actions.
Data access lives exclusively in the Python backend now (SQLAlchemy 2.0
async + Alembic + PostgreSQL) — Prisma is not part of this project.
`lib/db/*.ts` calls this API over plain `fetch()` — no HTTP client
dependency; Next.js's built-in per-render fetch memoization handles deduping
identical read calls — via a thin `lib/api/{client,types,mappers}.ts` adapter
that converts the API's snake_case JSON into the frontend's existing
camelCase TS types.

`lib/api/client.ts` has two entry points, and the split matters:
`apiFetch`/`apiFetchOrNull` for the public read-only catalog (GET, no
headers, memoized per render), and **`apiRequest`** for anything
per-visitor or mutating — cart, customer auth, account. `apiRequest` adds
the method + JSON body, attaches exactly one identity header
(`Authorization: Bearer` when signed in, else `X-Guest-Cart-Token`), sets
`cache: "no-store"` so two visitors can never share a cart out of the Data
Cache, and normalises FastAPI's three `detail` shapes into an `ApiError`
carrying the machine-readable `code`. `lib/i18n/errors.ts` maps that code to
one Persian sentence — **never** string-match English prose from the API.

**There is no mock data layer.** `lib/mock/*` was deleted once every screen
was wired to the API; `backend/scripts/seed.py` is the sole source of demo
content, and it writes to a real database. There is likewise no client-side
cart or auth store — see the State row below.

| Layer | Choice |
|---|---|
| Frontend framework | Next.js 16.3.3, App Router, TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first — `@theme` in `app/globals.css`, no `tailwind.config.*` file), CSS variables for tokens |
| Backend | Python 3.12, FastAPI, served from `backend/` — see `backend/README.md` |
| DB | PostgreSQL |
| ORM | SQLAlchemy 2.0 (async) + Alembic, in the Python backend — **not** Prisma |
| Auth | Custom OTP over phone (SMS) or email, JWT in httpOnly cookie (no NextAuth). Customer and admin auth are separate systems — see §6 |
| Payments | ZarinPal, behind a `PaymentProvider` interface |
| SMS | Kavenegar or SMS.ir, behind an `SmsProvider` interface (`backend/app/core/sms.py`) — backend-side, a `console` dev mode prints the code to the terminal |
| Email | Console (dev) or SMTP via Python's stdlib `smtplib`, behind an `EmailProvider` interface (`backend/app/core/email.py`) — no email SDK dependency |
| Search | Postgres `LIKE` over a normalised expression + a `pg_trgm` GIN index (migration 0004). No Elasticsearch, no `tsvector` — Postgres has no Persian text-search config, so there is no stemmer to use |
| Validation | Plain runtime checks (regex/length/required) in Server Actions; structured `{code}`-shaped error responses from the backend, mapped to Persian strings in `lib/i18n/fa.ts`. **No Zod anywhere in this codebase** |
| Forms | Plain `useState` per form (a flat values object + a generic `set(key, value)` setter), submitted via a Server Action. **No `react-hook-form`, no form library** — neither is installed; every form built so far (login, admin product/category forms, address form) follows this same shape |
| State | Server Components by default; Server Actions for mutations; Zustand only for the toast queue (`lib/stores/toast-store.ts`). Cart and customer-auth state live server-side (httpOnly cookie + Postgres), **not** in a client store — `lib/stores/{cart,auth}-store.ts` were deleted, and re-introducing either would immediately drift from the database |
| Images | next/image; **admin-uploaded** product images live on the backend (`backend/uploads/`, served at `/api/v1/uploads/*`), resolved via `BACKEND_PUBLIC_ORIGIN` — see §6; storefront/brand assets stay in `/public` |
| Deploy | Self-hosted Ubuntu VPS — Node + PM2 + Nginx + Certbot (frontend); uv-managed Python service (backend) |

**No** Vercel-only APIs. **No** external CDN for fonts or scripts — many Iranian
users cannot reach Google Fonts. Self-host everything in `/public`.

## 3. Design system

Ported from a coworker's redesign (originally a separate vanilla-JS
prototype on branch `frontend-new-design`, read as a design/behavior
reference — never merged as code). **The port is complete**: every
storefront screen — home, category, product, cart, login, account — is the
ported design, wired to the real API. `frontend-new-design` remains the
visual reference of record; don't re-derive a screen from the old v1 UI.
Full token values live in
`app/globals.css`'s `@theme` block, which clears Tailwind's default color
palette (`--color-*: initial`) before redeclaring — no hex/oklch value
should appear anywhere else in the codebase.

```css
/* app/globals.css — @theme (abbreviated; see the file for the full set) */
--color-ink:              #17211D;  /* body text AND every primary CTA */
--color-emerald:          #0C3A2C;  /* ground: header, footer, trust band, highlight cards */
--color-emerald-live:     #1C8A69;  /* GRAPHICAL only — focus ring, dots, hero rule */
--color-emerald-live-deep:#0C7350;  /* the TEXT-bearing green — in-stock badge, WhatsApp button */
--color-page:             #EAE9E1;  /* page ground — cool, powdery almond */
--color-surface:          #F7F6F1;  /* cards, sidebar, panels */
--color-danger:           #9E2B20;  /* discount badge, remove, OTP errors */
--color-warn:             #8A5A12;  /* low stock, clamped qty, safety notes */
--color-info:             #2C556C;  /* "not live yet" messaging, not a caution */
--color-dept-*:           /* six OKLCH pairs — diagnostics/consumables/rehab/homecare/clinic/accessories */
```

**Non-negotiable rules:**
- **CTA color is ink (`#17211D`) everywhere.** Emerald is reserved for
  ground and state, never a button fill. **Coral/terracotta is explicitly
  banned** — treated as a generic "AI-generated site" tell.
- **Department color-coding** (`lib/utils/department.ts` +
  `components/shop/DepartmentMark.tsx`, the *only* sanctioned way to render
  one): a department hue must **never** appear without its icon and label —
  color is always the third cue, never the only one. Only **one** department
  color is ever visible on a given category/product page; the home category
  rail is the only place all six appear together, as a legend. **No
  department color on the shopping surface itself** — product cards, prices,
  ratings, add-to-cart buttons and badges use ink/danger/warn only.
- **Four distinct card treatments, not one generic `<Card>`** (`Card.tsx`
  is retired): `components/ui/Panel.tsx` (hairline surface, for
  empty/terminal states — dashed border + a letterhead watermark),
  `components/ui/HighlightCard.tsx` (emerald ground, reversed text, only
  "where the site is speaking rather than listing" — PDP key specs, the
  cart's help card, the mega-menu panel),
  `components/ui/RuleBox.tsx` (one box divided by hairlines — service
  cells, trust badges — reads as a set, not individual cards), and the
  product card (its own component, hairline border + full-bleed photo, no
  shadow, no image zoom, border darkens on hover only).
- **Radius**: `2–10px` for cards/panels/inputs (`--radius-1`…`-7`), never
  pill except buttons (`--radius-pill`, in `Button`'s base class, not a
  variant — every button in this design is a pill).
- **Shadows are used in exactly two places by design**: the home finder
  card floating off the hero (`--shadow-float`) and the cart dropdown
  (`--shadow-pop`). Everywhere else is a hairline border, never a shadow.
- **Motion is plain CSS** (keyframes + transitions in `app/globals.css`,
  crossfade via `components/ui/ScreenTransition.tsx` keyed on screen
  identity) — no animation library. Thesis: "weighted, damped, certain,"
  never scroll-triggered (no `IntersectionObserver` reveals/parallax
  anywhere). Every entrance collapses to a plain 140ms opacity fade under
  `prefers-reduced-motion`.
- **"Two audiences, one card"**: a ۹۵٬۰۰۰-toman item and an
  ۸۹-million-toman item use the identical card and price treatment — no
  premium tier styling.
- Font: **Vazirmatn**, self-hosted woff2 in `/public/fonts`, weights
  400/500/600/700/800, loaded via `@font-face` in `app/globals.css` (not
  `next/font`).
- Numerals: Persian digits in prose/prices/spec values
  (`toPersianDigits`/`formatToman`); **Latin digits in SKU, phone, postal
  code**, wrapped `direction:ltr; unicode-bidi:plaintext`.

## 4. RTL / localization rules (non-negotiable)

- `<html lang="fa" dir="rtl">`.
- Use Tailwind **logical properties** everywhere: `ps-`/`pe-`/`ms-`/`me-`,
  `start-`/`end-`, `text-start`/`text-end`. Never `pl-`/`pr-`/`left-`/`right-`.
- Directional glyphs must point the RTL way. The ported design uses literal
  `→`/`←` characters for the hero arrows and pagination (→ = previous,
  ← = next), not icon components — there is no `<DirIcon>` helper any more.
- All prices render through `formatToman(n)` → `۱٬۲۵۰٬۰۰۰ تومان` (Persian
  digits, thousands separator `٬`).
- All dates render through `formatJalali(d)` → `چهارشنبه ۲۴ تیر ۱۴۰۵ - ۱۹:۱۸`.
- Numbers stored in DB are always plain integers in **Toman** (not Rial).
- All user-facing strings live in `lib/i18n/fa.ts`. Never hardcode Persian in a
  component. This keeps a future English version cheap.

## 5. Conventions

- `app/(shop)/…` public storefront (including `/account`, which keeps the
  shop chrome), `app/(auth)/…`, `app/admin/…` (login page
  at `app/admin/login/`, everything requiring auth under the route group
  `app/admin/(protected)/` so the shared sidebar layout can't leak onto the
  public login page — route groups don't add a URL segment).
- Server Components by default. `"use client"` only for interactivity.
- Mutations = **Server Actions** in `app/**/actions.ts`, validated with plain
  runtime checks (no Zod — see §2), returning
  `{ ok: true, data } | { ok: false, error }`. Never throw to the UI.
- API access only in `lib/db/*.ts` query modules — never `fetch` inside a
  component. Cookie reads/writes only in `lib/session.ts`; it is the single
  place that knows the three cookie names and the `cart_count` mirror.
- **Filtering, searching, sorting, paging and counting all happen in
  Postgres, not in JS.** `GET /products/` supports `q`, `category_slug`,
  `price_min`, `price_max`, `brands` (repeated), `in_stock_only`,
  `is_featured`, `sort`, `page`, `page_size` and `include_facets`;
  `lib/db/products.ts` forwards them and is the only module that builds that
  query string. Never fetch the whole catalog and narrow it client-side — it
  scales badly and reports a `total` that disagrees with the server's.
- **Counts come from the facet block, never from a loop.** Asking for
  `include_facets=true` returns brand / department / sub-category / in-stock
  counts and the price range for the *same* filtered set, computed as a fixed
  five aggregates. If you find yourself issuing one request per category to
  get a number, that is the N+1 this replaced.
- **Search normalisation lives in exactly one place**
  (`backend/app/core/search.py`) and is applied twice — in Python to the query
  and in SQL to the column, via the same `translate()` table. Do not fold
  Persian in the frontend; a second table would drift from the first and
  search would silently stop matching. `backend/tests/test_search.py` asserts
  the two agree.
- **All filter state lives in the URL**, so a filtered listing is shareable,
  bookmarkable and back-button-correct. The only client state on the
  category page is whether the mobile filter sheet is open.
- Every price/stock check happens **server-side at checkout**. Never trust the cart.
- Components: `components/ui/*` (primitives), `components/shop/*` (domain).
- Commit per phase with a clear message. Run `npm run build` before each commit.

## 6. Security baseline

- OTP: 6 digits, 2-minute TTL, max 5 verify attempts, rate-limited per
  **contact** (phone or email — see §2's Auth row) **and** IP. Store only a
  hash of the code (`hash_otp_code`/`verify_otp_code`, reusing the same
  `passlib` argon2 context as admin passwords). Never log it in production —
  the two `console`-mode providers (`backend/app/core/{sms,email}.py`) are
  the *only* places a raw code is ever printed, and only in development.
  OTP generation/verification/rate-limiting/provider-dispatch all happen
  **backend-side only** — it owns the DB and the rate-limit counters, so
  `SMS_PROVIDER`/`EMAIL_PROVIDER`/etc. live in `backend/.env`, not the
  frontend's `.env.local` (see §7).
- Customer JWT in `httpOnly`, `secure`, `sameSite=lax` cookie, 30-day expiry,
  single-issue (no refresh-token rotation) — see "Customer auth pattern"
  below.
- Verify the ZarinPal callback server-side before marking an order paid.
  Guard against double-verification (idempotent by `authority`).
- Validate every input with plain runtime checks (no Zod — see §2). Escape
  all user-generated review text.

### Where the design is honest about a gap

Several screens deliberately state that a feature is not live rather than
faking it: the PDP's نظرات tab (no review submission) and the disabled
«به‌زودی» compare/save buttons. **Do not "finish" any of these with
placeholder behaviour** — see `docs/BACKEND-GAPS.md` for what each one is
waiting on and what it costs to build for real.

Two of the original honesty states have since been retired *because the
feature became real*, which is the only acceptable way to remove one: text
search now has a `q` param and a results page, and the cart now ends in a
checkout button because `/checkout`, `/checkout/mock-pay`, `/orders/[id]` and
the account's سفارش‌ها list all call live Phase 6 endpoints.

### Customer auth pattern (implemented)

Customer auth is a separate `User` model/table (not `AdminUser`),
authenticated via a 6-digit OTP sent to either a phone (SMS) or an email
address — a single `POST /api/v1/auth/customer/request-otp` endpoint
accepts one `contact` field and classifies phone-vs-email server-side
(`^09\d{9}$`, else a basic email regex). Phone and email are **separate
identities** — verifying by one and later by the other creates two
unrelated accounts with separate carts and addresses; there is no
cross-channel merge.

- The backend issues stateless bearer tokens only
  (`POST .../verify-otp` → `{access_token, expires_in, contact, cart}`),
  30-day expiry (`CUSTOMER_JWT_EXPIRE_DAYS`), no refresh-token flow.
- The Next.js frontend owns the httpOnly `customer_token` cookie, set by a
  **Server Action** (`app/(auth)/login/actions.ts`) — unlike the admin
  exception below, this is a Server Action rather than a Route Handler,
  since Next.js Server Actions can call `cookies().set()` directly and this
  keeps customer auth on the same Server-Action convention as the rest of
  the app.
- `middleware.ts`'s `/account/:path*` branch is a cheap cookie-presence
  check only (UX redirect) — never the security boundary. Enforcement is
  the backend's `get_current_customer` dependency, invoked on every
  `/account/*` and authenticated `/cart/*` request.
- Guest carts are identified by a separate `guest_cart_token` httpOnly
  cookie, minted by `middleware.ts` for every visitor (not just logged-in
  ones — the cart's contents live in Postgres, keyed by this opaque token
  until login), forwarded as `X-Guest-Cart-Token` only when no bearer token
  is present. Merged server-side into the account's cart on a successful
  `verify-otp`, then cleared — a fresh token is minted for the next
  anonymous session, so an account's cart never leaks to a shared device's
  next guest.

### Admin auth pattern (implemented)

Admin auth is **separate from** the customer SMS-OTP auth above — a distinct
`AdminUser` model/table in the backend (`passlib[argon2]` password hashes,
not the reserved `app/models/user.py` earmarked for future customer auth).

- The backend issues **stateless bearer tokens only**
  (`POST /api/v1/auth/admin/login` → `{access_token, expires_in}` JSON, no
  cookie logic in the backend at all, no refresh-token flow — 8-hour expiry,
  re-login after that).
- The **Next.js frontend owns the httpOnly cookie**, set by a Route Handler
  (`app/api/admin/login/route.ts`) that proxies the login call server-side —
  the browser never talks to the backend directly, so `JWT_SECRET` never
  needs to reach the frontend and no `NEXT_PUBLIC_*` backend URL is needed
  for auth.
- `middleware.ts` (matcher `/admin/:path*`) does a **cheap cookie-presence
  check only** — it's a UX redirect to `/admin/login`, not the real security
  boundary, and it must never be described as enforcement.
- The **real enforcement** is the backend's `get_current_admin` FastAPI
  dependency (`app/api/v1/auth.py`), mounted on every `/admin/*` backend
  route — it validates the JWT signature and `role == "ADMIN"` on every
  request, independent of anything the frontend does. This split is
  deliberate: a bug in `middleware.ts` should degrade to "confusing redirect,"
  never to "unauthenticated write succeeds."

## 7. Environment variables

Frontend (`.env.local`, gitignored — see `.env.example`):
```
API_BASE_URL=http://localhost:8000/api/v1
BACKEND_PUBLIC_ORIGIN=http://localhost:8000
NEXT_PUBLIC_SITE_URL=https://karamadmedtech.ir
```
`API_BASE_URL` is read server-side only, by `lib/api/client.ts`, defaulting
to `http://localhost:8000/api/v1` when unset — every `lib/db/*.ts` call site
is a Server Component running on the Node.js process, so this deliberately
isn't a `NEXT_PUBLIC_*` var (no reason to inline it into the client bundle).
`BACKEND_PUBLIC_ORIGIN` is the **browser-facing** backend origin — a
different concern from `API_BASE_URL`, which can be a loopback-only address
in production that the browser can't reach. It resolves admin-uploaded
product image URLs (`lib/api/mappers.ts`'s `resolveImageUrl`) and scopes
`next.config.ts`'s `images.remotePatterns`. Also server-side only.

Backend (`backend/.env`, gitignored — see `backend/.env.example`):
```
DATABASE_URL=
JWT_SECRET=
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480
UPLOAD_DIR=uploads
FRONTEND_ORIGIN=
SMS_PROVIDER=console|kavenegar|smsir
SMS_API_KEY=
SMS_TEMPLATE=
EMAIL_PROVIDER=console|smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_ADDRESS=
OTP_TTL_SECONDS=120
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=120
OTP_MAX_REQUESTS_PER_CONTACT_PER_HOUR=5
OTP_MAX_REQUESTS_PER_IP_PER_HOUR=20
CUSTOMER_JWT_EXPIRE_DAYS=30
PAYMENT_PROVIDER=mock|zarinpal
ZARINPAL_MERCHANT_ID=
ZARINPAL_SANDBOX=true
ZARINPAL_CALLBACK_URL=
REVIEW_MAX_SUBMISSIONS_PER_IP_PER_HOUR=5
```
`SMS_PROVIDER`/`EMAIL_PROVIDER`/etc. live here, **not** the frontend's
`.env.local` — OTP generation/verification is backend-only (see §6). Likewise
`PAYMENT_PROVIDER`/`ZARINPAL_*` live here, not the frontend — the backend's
`PaymentProvider` interface (`backend/app/core/payment.py`) owns the ZarinPal
request/verify round trip and the callback route entirely; the frontend only
ever calls `POST /api/v1/payments/request` and is redirected straight to
ZarinPal's own hosted payment page, never touching a merchant credential. The
frontend does not read any backend credential.

In development, `SMS_PROVIDER=console`/`EMAIL_PROVIDER=console` print the
OTP to the backend's terminal, and `PAYMENT_PROVIDER=mock` auto-approves
payment. **Never** block development on real credentials.

## 8. Open decisions

- **Shipping rules** — TBD, owner is being consulted. Build shipping as a
  `Setting` row read at checkout, with a default of *flat rate + free over a
  threshold*, both editable in the admin panel. Do not hardcode.
- **Logo** — no logo file yet. Generate an SVG wordmark: «تجهیزات پزشکی کارآمد»
  with a tagline underneath, plus a compact icon mark usable as favicon and in
  the mobile header. Keep it in `components/brand/Logo.tsx` so one file swaps it.
- Server credentials for deployment — provided later by the owner of the repo.

## 9. Working style for Claude Code

- Work **one phase at a time** (see `docs/ROADMAP.md`). Start each phase in a
  fresh session with `/clear` to keep context small and cost low.
- Use plan mode for any phase touching more than ~5 files; get approval first.
- Do not scaffold features from later phases early.
- Do not add dependencies not listed here without asking.
- Invoke the UI/UX skill before UI work — see section 10.
- Prefer editing existing files over creating parallel ones.
- The `app/(shop)/**` tree renders dynamically **by design** — `Header`
  reads a `cart_count` cookie on every request so the cart badge is correct
  and hydration-safe without an extra `GET /cart/` on ordinary page loads
  (which would otherwise create a database row per anonymous visit, since
  the backend lazily creates a cart for any unseen guest token). This is a
  deliberate trade-off for this project's scale (self-hosted, no CDN,
  loopback backend) — don't "fix" it back to static rendering without
  re-solving that problem first. The header dropdown fetches the cart's
  contents on open (a `fetchCartAction` Server Action), which is a real
  intent and worth the row.

- **No local PostgreSQL?** `backend/devdb.sh` runs the PostgreSQL binaries
  that ship inside the `pgserver` pip package on a fixed port, so the real
  stack (real Alembic migrations, real `JSONB`/`UUID` columns, real
  `scripts/seed.py`) can be exercised without installing a server. Dev-only;
  it is not part of the deployed stack, which uses a real PostgreSQL
  instance per `docs/DEPLOY.md`.

## 10. Skills — use them

The developer maintains personal skills in `~/.claude/skills/`, including a
**UI/UX design skill** and a second project skill. They are not optional extras:

- **Before writing any component, layout or page** — that means phases 0, 2,
  3, 4 and 8 — check your available skills and **invoke the UI/UX design skill
  first**, then build to whatever it specifies.
- Where the UI/UX skill and this file disagree on a **visual or interaction**
  decision (spacing scale, type scale, component anatomy, motion, accessibility),
  **the skill wins** — it is the developer's house style and outlives this project.
- Where they disagree on a **project constraint** (the palette in section 3, the
  RTL rules in section 4, the stack in section 2), **this file wins** — those are
  client requirements, not style preferences.
- If invoking a skill changes a decision recorded here, update this file in the
  same commit so the next session inherits the correction.
- Any skill placed in the repo's own `.claude/skills/` applies to this project
  only and takes precedence over the personal copy of the same skill.

Never skip the skill because a task looks small. A button variant built without
it is a button variant that will be rebuilt later.
