# Roadmap — Medical Supplies E-Commerce

**تجهیزات پزشکی کارآمد** · karamadmedtech.ir
Persian RTL storefront · Next.js 15 · PostgreSQL · self-hosted Ubuntu
Reference layout: `iprojector.ir` (10 screenshots) · Medical blue/teal palette

---

## Confirmed scope

| Decision | Answer |
|---|---|
| Stack | Next.js 15 + Tailwind v4 + Prisma + PostgreSQL |
| Payment | ZarinPal (real gateway, behind an adapter) |
| Auth | SMS OTP login, exactly like reference screenshot 9 |
| Admin | Full admin panel — products, categories, orders, reviews, settings |
| Design | Reference layout, medical palette |
| Content | ~40 seeded placeholder products, owner replaces via admin |
| v1 features | Core shop · Cart page · Login · Reviews & ratings |
| Language | Persian only, RTL, Toman, Jalali dates |
| Hosting | Your Ubuntu server (details pending) |
| Shipping | **TBD** — built as an editable admin setting, flat-rate default |
| Branding | **تجهیزات پزشکی کارآمد** · domain **karamadmedtech.ir** · SVG wordmark to generate |

Deferred out of v1 (easy to add later): blog/مقالات, product comparison,
wishlist, coupon codes, province-based shipping zones, prescription flags,
multi-language.

---

## Budget reality check

$50 of Claude Code credit is roughly **one focused build week** if you work in
phases and keep context small. What protects the budget:

1. **One phase per session.** `/clear` between phases. Long sessions re-send the
   whole conversation on every turn — that is where credit disappears.
2. **`CLAUDE.md` does the repeating.** Stack, palette and RTL rules live there,
   so you never re-explain them in a prompt.
3. **Plan mode before big phases.** Approving a plan is far cheaper than undoing
   a wrong implementation.
4. **You run the build/tests.** Paste only the failing output, not full logs.
5. **Don't ask for redesigns mid-phase.** Note them, batch them into a polish pass.

Realistic expectation: phases 0–7 comfortably within budget; the admin panel
(phase 8) is the largest single chunk — start it with a fresh session.

Recurring costs outside the $50, which the **owner** must cover:
SMS panel credit (Kavenegar/SMS.ir, ~pay-per-message), ZarinPal merchant account
(requires the business's نماد اعتماد and licence — weeks of paperwork, start it
now in parallel), domain, and the Ubuntu server.

---

## Phases

### Phase 0 — Scaffold & design system ✅ done (2026-08-26)
Next.js + TS + Tailwind v4, self-hosted Vazirmatn, `dir="rtl"`, palette tokens,
`formatToman` / `formatJalali` / `toPersianDigits` helpers, `lib/i18n/fa.ts`,
UI primitives (Button, Input, Card, Badge, Pill, Modal, Tabs, Rating, DirIcon).
**Done when:** a tokens demo page renders every primitive correctly in RTL.

**Actually delivered:** this went beyond the phase as scoped above — the
session built a full mocked demo (home, category, product, cart and login
pages, header/footer/mega-menu, 15 of the ~40 planned products) reading
through `lib/db/*.ts` against `lib/mock/*.ts`. See `README.md` for the
real-vs-mocked breakdown. This pulls forward most of the *UI* work originally
scoped for phases 2–5; those phases now mean "wire the existing UI to a real
backend and fill functional gaps," not "build the UI." `docs/PROMPTS.md` has
been annotated accordingly.

### Phase 1 — Data layer
Prisma schema + migration + seed: `Category` (self-referencing, 2 levels),
`Product`, `ProductImage`, `ProductSpec`, `User`, `OtpCode`, `Address`, `Cart`,
`CartItem`, `Order`, `OrderItem`, `Payment`, `Review`, `ReviewVote`, `Setting`.
Seed 6 categories with sub-categories and ~40 realistic Persian products
(فشارسنج، پالس اکسیمتر، دستکش معاینه، ماسک، واکر، نبولایزر، تخت معاینه…).
**Done when:** `npx prisma studio` shows a coherent catalog.

### Phase 2 — Layout shell
Sticky header: centered logo, cart pill (top-start) with dropdown preview
(ref. 10), phone widget, search icon, coral login/register pill (top-end).
Mega-menu nav with multi-column dropdown (ref. 2). Footer: trust-badge row
(ref. 8), social icons, 4 link columns, licence badge slots, contact block.
Floating WhatsApp button. Mobile drawer nav.
**Done when:** header/footer are pixel-close to refs 1, 2 and 8 at all breakpoints.

### Phase 3 — Home page
Hero slider (autoplay, dots, arrows, gradient mesh background), floating search
bar overlapping the hero, category icon-card row (ref. 1), "newest products"
and "bestsellers" carousels, the four service cards (ref. 3), trust-badge row.
**Done when:** home matches refs 1, 3 and 10 and is responsive.

### Phase 4 — Catalog
Category listing with sidebar filters (price range, brand, in-stock, sub-category),
sort dropdown, pagination, skeleton loading. Product detail page (ref. 4):
breadcrumb, gallery with thumbnail strip, stock badge, price block, buy +
compare-slot buttons, spec sidebar, rating stars, then tabs — نقد و بررسی
(rich text), مشخصات (spec table, ref. 7), نظرات (phase 7). Search results page.
**Done when:** you can browse from home → category → product with real seed data.

### Phase 5 — Cart & auth
Cart page: line items with quantity steppers, remove, subtotal, shipping
placeholder, total, empty state. Persistent cart (guest cart in cookie, merged
into the DB cart on login). SMS-OTP login page (ref. 9): single phone/email
field → code entry → session. Rate limiting and attempt caps. Console SMS
provider for development. Account area: profile, addresses, order history.
**Done when:** you can log in with a code printed to the terminal and your cart survives it.

### Phase 6 — Checkout, payment & orders
Checkout: address selection/creation, shipping cost from the `Setting` row,
order summary, order creation with a server-side re-price and stock check.
ZarinPal adapter: request → redirect → callback verify → mark paid → decrement
stock → order confirmation page. Mock provider for development. Order tracking
page by order number. Order status timeline.
**Done when:** an end-to-end purchase works against the ZarinPal sandbox.

### Phase 7 — Reviews & ratings
Review form (name, optional phone, text — ref. 6), star ratings, aggregate
rating on the product card and detail page, like/dislike votes, threaded
replies, "pending approval" state feeding the admin moderation queue.
**Done when:** a submitted review appears only after admin approval.

### Phase 8 — Admin panel *(largest phase — fresh session)*
Protected `/admin` with role middleware. Dashboard (sales, orders, low stock).
Products CRUD with multi-image upload, specs repeater, rich-text description.
Categories CRUD with ordering and icons. Orders list, detail, status changes.
Review moderation. Users list. Settings: shipping rule, contact details, social
links, hero slides, homepage sections.
**Done when:** the owner can add a product and change shipping without touching code.

### Phase 9 — Deployment
Ubuntu: Node LTS, PostgreSQL, PM2 or systemd unit, Nginx reverse proxy, Certbot
TLS, firewall, `.env` handling, `prisma migrate deploy`, an uploads backup and a
`pg_dump` cron, a simple deploy script. SEO pass: metadata, Persian OG tags,
`sitemap.xml`, `robots.txt`, JSON-LD Product schema. Lighthouse pass.
**Done when:** the site is live on your domain over HTTPS.

---

## Order of external work (start now, runs in parallel)

1. **ZarinPal merchant ID** — needs the business licence and نماد اعتماد. Longest
   lead time by far. Begin immediately; development uses the sandbox meanwhile.
2. **SMS panel** — Kavenegar or SMS.ir account plus an approved OTP template.
   Template approval takes a few days.
3. **Server + TLS** — `karamadmedtech.ir` is chosen; point DNS at the Ubuntu box
   before phase 9. A `.ir` domain registration needs the owner's national ID.
4. **Real product data and photos** from the owner — can arrive any time before
   launch, since the admin panel handles it.
5. **Shipping rules** from the owner — needed before phase 6 finishes.

## Risks

- **ZarinPal paperwork slips.** Mitigation: the adapter means launch can proceed
  with card-to-card or COD and the gateway drops in later.
- **Google Fonts / external CDNs are unreliable from Iran.** Mitigation: already
  ruled out in `CLAUDE.md` — everything is self-hosted.
- **RTL bugs discovered late.** Mitigation: logical properties enforced from
  phase 0; check every phase at 375px and 1440px before committing.
- **Budget burn from long sessions.** Mitigation: one phase per session, `/clear`.
- **Scope creep from the owner.** Mitigation: the deferred list above is the
  v1.1 backlog — write requests there, don't absorb them mid-phase.
