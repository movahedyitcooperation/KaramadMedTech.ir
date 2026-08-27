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

| Layer | Choice |
|---|---|
| Framework | Next.js 15+, App Router, TypeScript (strict) |
| Styling | Tailwind CSS v4, CSS variables for tokens |
| DB | PostgreSQL |
| ORM | Prisma |
| Auth | Custom SMS-OTP, JWT in httpOnly cookie (no NextAuth) |
| Payments | ZarinPal, behind a `PaymentProvider` interface |
| SMS | Kavenegar or SMS.ir, behind an `SmsProvider` interface |
| Validation | Zod on every server action / route handler |
| Forms | react-hook-form + zod resolver |
| State | Server components by default; Zustand only for cart |
| Images | next/image, local uploads to `/public/uploads` |
| Deploy | Self-hosted Ubuntu VPS — Node + PM2 + Nginx + Certbot |

**No** Vercel-only APIs. **No** external CDN for fonts or scripts — many Iranian
users cannot reach Google Fonts. Self-host everything in `/public`.

## 3. Design system

Same information architecture as the reference. **"Clinical Calm"** palette —
cyan-teal primary + health green + a warm accent, on a full neutral ramp. The
authoritative source is `app/globals.css` `@theme`; `/dev/tokens` renders every
token. Revised 2026-08-27 from the original flat-blue palette (visual redesign
approved by the repo owner).

```css
/* app/globals.css — @theme */
/* Primary — cyan-teal; brand-600 is the workhorse (links, headers, buttons) */
--color-brand-50:  #ECFAF9;
--color-brand-100: #CFF2EF;
--color-brand-200: #A3E5DF;   /* subtle borders / hover outlines */
--color-brand-500: #0FA3A3;   /* interactive lighten */
--color-brand-600: #0E7C86;   /* primary */
--color-brand-700: #0B5D66;   /* pressed / deep */
--color-brand-900: #06373D;   /* hero mesh anchor */
--color-green-500: #0F9D6B;   /* success, in-stock, cart CTA (Button variant="success") */
--color-green-600: #0B7E58;
--color-accent-500: #E85D3D;  /* secondary CTA (login/register, مشاوره), discount flags */
--color-accent-600: #CB4A2E;
--color-ink-900:   #0C1A24;   /* headings */
--color-ink-700:   #2B3E4A;   /* body text */
--color-ink-500:   #5C7079;   /* muted text */
--color-ink-400:   #8A9BA3;   /* captions / meta / struck prices */
--color-line:      #DCE7EA;   /* hairline borders */
--color-line-strong: #C2D3D7; /* dividers, input borders */
--color-bg:        #F3F8F8;   /* page background */
--color-surface:   #FFFFFF;   /* cards */
--color-danger:    #DC2626;   /* destructive only — never decorative */
```

Rules:
- Radius tokens: `--radius-card` 16px, `--radius-tile` 10px (chips, icon tiles,
  licence slots), `--radius-pill` 999px, `--radius-input` 8px.
- Elevation scale (not ad-hoc shadows): `--shadow-xs`/`-sm`/`-md`/`-lg`. Cards
  rest at `shadow-sm` and lift to `shadow-md` on hover; floating controls
  `shadow-md`; overlays `shadow-lg`.
- Motion tokens: `--duration-fast` 120ms, `--duration-base` 200ms,
  `--duration-slow` 320ms, with `--ease-out-soft`. Hover lifts are
  `transform`-only and must be gated by `prefers-reduced-motion` (handled
  globally in `globals.css`).
- Type: **Vazirmatn**, self-hosted woff2 in `/public/fonts`, weights 400/500/700
  only. Scale 13 · 14 · 16 (base) · 18 · 22 · 28 · 36; body `line-height` 1.7,
  headings 1.35. Prices/quantities use the `.tabular` utility for stable digits.
- The reference's neon/hexagon hero decoration is `components/shop/BrandMesh.tsx`
  — a soft cyan→teal→green gradient mesh with a faint plus/cross motif. No neon
  glow. `strength="hero"` (behind the hero) or `"subtle"` (behind the footer).
- Signature section marker: `components/ui/SectionHeader.tsx` — a 32px
  `accent-500` rule on the logical-**start** side, an optional `brand-600`
  kicker label, then the heading. Use it for every section heading rather than
  re-implementing the tick.

## 4. RTL / localization rules (non-negotiable)

- `<html lang="fa" dir="rtl">`.
- Use Tailwind **logical properties** everywhere: `ps-`/`pe-`/`ms-`/`me-`,
  `start-`/`end-`, `text-start`/`text-end`. Never `pl-`/`pr-`/`left-`/`right-`.
- Directional icons (chevrons, arrows) must flip. Wrap in a `<DirIcon>` helper.
- All prices render through `formatToman(n)` → `۱٬۲۵۰٬۰۰۰ تومان` (Persian
  digits, thousands separator `٬`), on an element carrying the `.tabular`
  utility so digits don't reflow.
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

```
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_SITE_URL=https://karamadmedtech.ir
SMS_PROVIDER=console|kavenegar|smsir
SMS_API_KEY=
SMS_TEMPLATE=
PAYMENT_PROVIDER=mock|zarinpal
ZARINPAL_MERCHANT_ID=
ZARINPAL_SANDBOX=true
```
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
