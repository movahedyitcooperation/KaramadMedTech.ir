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

Visual reference: `docs/references/` (10 screenshots of `iprojector.ir`).
We reuse that site's **layout and information architecture**, not its colors.

## 2. Stack (fixed — do not substitute)

**Split-service architecture as of the `backend/` scaffold:** the storefront
is a Next.js frontend that talks to a **separate Python/FastAPI backend**
(this repo's `backend/` directory) over a JSON REST API at `/api/v1/*`,
rather than Next.js owning the database directly via Prisma/Server Actions.
Data access lives exclusively in the Python backend now (SQLAlchemy 2.0
async + Alembic + PostgreSQL) — Prisma is not part of this project.
`lib/db/*.ts` now calls this API over plain `fetch()` — no HTTP client
dependency; Next.js's built-in per-render fetch memoization handles deduping
identical calls — via a thin `lib/api/{client,types,mappers}.ts` adapter
that converts the API's snake_case JSON into the frontend's existing
camelCase TS types. `lib/mock/*.ts` is no longer imported by application
code; it's kept only as the historical source `backend/scripts/seed.py` was
transcribed from.

| Layer | Choice |
|---|---|
| Frontend framework | Next.js 15+, App Router, TypeScript (strict) |
| Styling | Tailwind CSS v4, CSS variables for tokens |
| Backend | Python 3.12, FastAPI, served from `backend/` — see `backend/README.md` |
| DB | PostgreSQL |
| ORM | SQLAlchemy 2.0 (async) + Alembic, in the Python backend — **not** Prisma |
| Auth | Custom SMS-OTP, JWT in httpOnly cookie (no NextAuth) |
| Payments | ZarinPal, behind a `PaymentProvider` interface |
| SMS | Kavenegar or SMS.ir, behind an `SmsProvider` interface |
| Validation | Zod on every server action / route handler (frontend); Pydantic schemas on every backend route |
| Forms | react-hook-form + zod resolver |
| State | Server components by default; Zustand only for cart |
| Images | next/image, local uploads to `/public/uploads` |
| Deploy | Self-hosted Ubuntu VPS — Node + PM2 + Nginx + Certbot (frontend); uv-managed Python service (backend) |

**No** Vercel-only APIs. **No** external CDN for fonts or scripts — many Iranian
users cannot reach Google Fonts. Self-host everything in `/public`.

## 3. Design system

Same structure as the reference, medical palette.

```css
/* app/globals.css — @theme */
--color-brand-50:  #EAF4FB;
--color-brand-100: #D2E7F6;
--color-brand-500: #1780C9;
--color-brand-600: #0E6BA8;   /* primary — headers, links, primary buttons */
--color-brand-700: #0A5382;
--color-teal-500:  #14A38B;   /* success, in-stock, cart button */
--color-teal-600:  #0F8672;
--color-coral-500: #E8613C;   /* secondary CTA — login/register, مشاوره */
--color-coral-600: #CF4F2C;
--color-ink-900:   #0F1B2A;   /* body text */
--color-ink-500:   #64748B;   /* muted text */
--color-line:      #E4EBF2;   /* borders */
--color-bg:        #F6F9FC;   /* page background */
--color-surface:   #FFFFFF;   /* cards */
--color-danger:    #DC2626;   /* destructive only — never decorative */
```

Rules:
- Radius: `12px` cards, `999px` pills (header buttons), `8px` inputs.
- Shadows: soft and low-contrast — `0 2px 12px rgb(15 27 42 / 0.06)`.
- The reference's neon/hexagon hero decorations become **soft blue gradient
  meshes with subtle cross/plus medical motifs**. No neon glow.
- Font: **Vazirmatn**, self-hosted woff2 in `/public/fonts`, weights 400/500/700.
- Section headings use a small colored tick on the **right** side (RTL), as in
  reference screenshots 1 and 3.

## 4. RTL / localization rules (non-negotiable)

- `<html lang="fa" dir="rtl">`.
- Use Tailwind **logical properties** everywhere: `ps-`/`pe-`/`ms-`/`me-`,
  `start-`/`end-`, `text-start`/`text-end`. Never `pl-`/`pr-`/`left-`/`right-`.
- Directional icons (chevrons, arrows) must flip. Wrap in a `<DirIcon>` helper.
- All prices render through `formatToman(n)` → `۱٬۲۵۰٬۰۰۰ تومان` (Persian
  digits, thousands separator `٬`).
- All dates render through `formatJalali(d)` → `چهارشنبه ۲۴ تیر ۱۴۰۵ - ۱۹:۱۸`.
- Numbers stored in DB are always plain integers in **Toman** (not Rial).
- All user-facing strings live in `lib/i18n/fa.ts`. Never hardcode Persian in a
  component. This keeps a future English version cheap.

## 5. Conventions

- `app/(shop)/…` public storefront, `app/(auth)/…`, `app/admin/…`.
- Server Components by default. `"use client"` only for interactivity.
- Mutations = **Server Actions** in `app/**/actions.ts`, validated with Zod,
  returning `{ ok: true, data } | { ok: false, error }`. Never throw to the UI.
- DB access only in `lib/db/*.ts` query modules — never Prisma inside a component.
- Every price/stock check happens **server-side at checkout**. Never trust the cart.
- Components: `components/ui/*` (primitives), `components/shop/*` (domain).
- Commit per phase with a clear message. Run `npm run build` before each commit.

## 6. Security baseline

- OTP: 6 digits, 2-minute TTL, max 5 attempts, rate-limited per phone **and** IP.
  Store only a hash of the code. Never log it in production.
- JWT in `httpOnly`, `secure`, `sameSite=lax` cookie. 30-day refresh.
- Admin routes protected by middleware checking `role === "ADMIN"`.
- Verify the ZarinPal callback server-side before marking an order paid.
  Guard against double-verification (idempotent by `authority`).
- Zod-validate every input. Escape all user-generated review text.

## 7. Environment variables

Frontend (`.env.local`, gitignored — see `.env.example`):
```
API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SITE_URL=https://karamadmedtech.ir
SMS_PROVIDER=console|kavenegar|smsir
SMS_API_KEY=
SMS_TEMPLATE=
PAYMENT_PROVIDER=mock|zarinpal
ZARINPAL_MERCHANT_ID=
ZARINPAL_SANDBOX=true
```
`API_BASE_URL` is read server-side only, by `lib/api/client.ts`, defaulting
to `http://localhost:8000/api/v1` when unset — every `lib/db/*.ts` call site
is a Server Component running on the Node.js process, so this deliberately
isn't a `NEXT_PUBLIC_*` var (no reason to inline it into the client bundle).

Backend credentials (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`) live in
`backend/.env` — see `backend/.env.example`. The frontend does not read them.

In development `SMS_PROVIDER=console` prints the OTP to the terminal and
`PAYMENT_PROVIDER=mock` auto-approves payment. **Never** block development on
real credentials.

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
