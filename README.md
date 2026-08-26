# Karamad MedTech — تجهیزات پزشکی کارآمد

A Persian (Farsi), full-RTL e-commerce storefront for a medical supplies business.
This repository currently holds a **demo/showcase build**: the real Next.js
foundation the project will keep building on, wired up to mock data so the
design and UX can be reviewed before the full backend (database, real
auth/SMS, payments, admin panel) is implemented.

See [`CLAUDE.md`](./CLAUDE.md) for the fixed stack/conventions and
[`docs/ROADMAP.md`](./docs/ROADMAP.md) for the full multi-phase production plan
this demo is the first slice of.

## Stack

- **Next.js 16** (App Router), **TypeScript** (strict)
- **Tailwind CSS v4** — design tokens as CSS variables in `app/globals.css`
- **Zustand** — cart and (demo) auth state, persisted to `localStorage`
- **Vazirmatn**, self-hosted in `public/fonts` (no external font CDN)
- **Phosphor Icons**, **dayjs** + **jalaliday** (Jalali/Shamsi dates), **class-variance-authority**
- **Vitest** for unit tests

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
npm run test     # lib/format.ts unit tests
```

`/dev/tokens` renders every color token, button variant and UI primitive for
a quick visual check of the design system.

## What's real vs. mocked in this demo

- **Real**: the Next.js app, all UI/UX, RTL/i18n handling, routing, the cart
  and login *flows*.
- **Mocked**: product/category/settings data (`lib/mock/*.ts`, read only
  through `lib/db/*.ts` query modules) and the OTP login (`lib/mock/auth.ts`
  simulates SMS verification — any 6-digit code succeeds). There is no
  database, no real SMS/JWT, no payment gateway, and no admin panel yet.
- Swapping in a real backend later should only mean rewriting `lib/db/*.ts`
  against Prisma/Postgres — nothing else reads mock data directly.

## Project structure

```
app/
  layout.tsx, globals.css, icon.svg   # root layout, design tokens, favicon
  dev/tokens/                          # design-system showcase page
  (shop)/                              # public storefront, shares Header/Footer
    page.tsx                           # home
    category/[slug]/page.tsx           # category listing: filters, sort, pagination
    product/[slug]/page.tsx            # product detail: gallery, tabs, JSON-LD
    cart/page.tsx
    search/page.tsx
  (auth)/
    login/page.tsx                     # two-step OTP login (simulated)

components/
  brand/Logo.tsx                       # SVG wordmark + icon mark (swap here for a real logo)
  ui/                                  # design-system primitives (Button, Input, Modal,
                                        # Tabs, Rating, Carousel, DirIcon, ...)
  shop/                                # domain components (Header, MegaMenuNav, ProductCard,
                                        # HeroSlider, CartView, OtpLoginFlow, ...)

lib/
  format.ts                            # toPersianDigits / formatToman / formatJalali
  i18n/fa.ts                           # every user-facing string (Persian)
  types/                               # Product, Category, Settings, CartLine shapes
  mock/                                # literal mock data + simulated OTP
  db/                                  # the only functions the app calls for data —
                                        # swap these for Prisma later, nothing else changes
  stores/                              # Zustand cart-store, auth-store
  seo/jsonld.ts                        # Product JSON-LD builder

hooks/                                 # usePrefersReducedMotion, useOnScreen
public/
  fonts/                               # self-hosted Vazirmatn (OFL-licensed)
  images/placeholders/                 # hand-authored SVG placeholders, no stock photos
```

## RTL / localization

`<html lang="fa" dir="rtl">` is fixed. Tailwind logical properties only
(`ps-`/`pe-`/`ms-`/`me-`/`start-`/`end-`) — see `CLAUDE.md` §4. All prices go
through `formatToman()`, all dates through `formatJalali()`, and every
user-facing string lives in `lib/i18n/fa.ts`.
