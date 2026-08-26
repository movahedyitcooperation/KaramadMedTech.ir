# Claude Code prompts — copy one per session

**How to use this file**

1. Create the project folder, put `CLAUDE.md` in its root and this file plus
   `ROADMAP.md` in `docs/`. Copy the 10 screenshots to `docs/references/`.
2. Run `claude` in that folder.
3. Paste **Prompt 0** first. When the phase is done: commit, then `/clear`,
   then paste the next prompt. One phase per session — this is what keeps the
   $50 alive.
4. For phases 4, 6 and 8, start with `/plan` and approve the plan before coding.

---

## Prompt 0 — Scaffold & design system

```
Read CLAUDE.md and docs/ROADMAP.md first, then look at the screenshots in
docs/references/ to understand the target layout.

Before writing any UI code, invoke my UI/UX design skill and follow it. Where it
conflicts with CLAUDE.md on a visual or interaction decision, the skill wins;
where it conflicts on palette, RTL rules or stack, CLAUDE.md wins.

Implement Phase 0 only.

Scaffold a Next.js 15 App Router project with TypeScript (strict), Tailwind CSS
v4 and ESLint, in this directory.

Set up:
- app/layout.tsx with <html lang="fa" dir="rtl">, Vazirmatn self-hosted from
  /public/fonts (download the woff2 files, weights 400/500/700, and declare
  @font-face in globals.css — do NOT link Google Fonts).
- The full color palette from CLAUDE.md section 3 as @theme variables in
  app/globals.css, plus radius and shadow tokens.
- lib/format.ts: toPersianDigits(), formatToman(n) -> "۱٬۲۵۰٬۰۰۰ تومان",
  formatJalali(date) -> "چهارشنبه ۲۴ تیر ۱۴۰۵ - ۱۹:۱۸". Use dayjs with the
  jalaliday plugin. Write unit tests for these three with vitest.
- lib/i18n/fa.ts exporting a nested object of every user-facing string. Start
  with header, nav, footer and common actions.
- components/ui/: Button (variants: primary/teal/coral/outline/ghost, sizes
  sm/md/lg, loading state), Input, Textarea, Select, Card, Badge, Pill, Modal,
  Tabs, Rating (read-only + interactive), Skeleton, and DirIcon (a wrapper that
  horizontally flips chevron/arrow icons in RTL).
- app/_dev/tokens/page.tsx rendering every color token, every button variant and
  every primitive, so I can eyeball the system.

Hard rules: logical Tailwind properties only (ps/pe/ms/me/start/end) — no
pl/pr/left/right anywhere. No hardcoded Persian strings inside components.

Run `npm run build` and the tests, fix anything broken, then stop and show me a
summary. Do not start Phase 1.
```

---

## Prompt 1 — Data layer

```
Read CLAUDE.md. Implement Phase 1 from docs/ROADMAP.md only.

Add Prisma with PostgreSQL. Design the schema for:

Category (id, slug, name, icon, parentId self-relation for 2 levels, sortOrder,
isActive), Product (slug, name, brand, shortDesc, description rich text, price,
compareAtPrice, stock, sku, isActive, isFeatured, categoryId, ratingAvg,
ratingCount), ProductImage (productId, url, alt, sortOrder), ProductSpec
(productId, group, key, value, sortOrder — this drives the مشخصات table in
reference screenshot 7), User (phone unique, email, name, role USER|ADMIN,
createdAt), OtpCode (phone, codeHash, expiresAt, attempts, consumedAt),
Address (userId, receiverName, phone, province, city, postalCode, line),
Cart + CartItem (support a guest cart keyed by a cookie token),
Order (orderNumber, userId, status enum PENDING|PAID|PROCESSING|SHIPPED|
DELIVERED|CANCELLED, subtotal, shippingCost, total, addressSnapshot json),
OrderItem (priceSnapshot, nameSnapshot, qty), Payment (orderId, provider,
authority, refId, status, raw json), Review (productId, userId nullable,
authorName, phone nullable, body, rating, status PENDING|APPROVED|REJECTED,
parentId for replies), ReviewVote (reviewId, voterKey, value +1/-1),
Setting (key unique, value json).

Then write prisma/seed.ts creating:
- 6 top-level categories with sub-categories: تجهیزات تشخیصی، مصرفی و بهداشتی،
  توانبخشی و ارتوپدی، مراقبت در منزل، تجهیزات مطب و کلینیک، لوازم جانبی
- ~40 realistic Persian medical products spread across them, with believable
  Toman prices, stock levels, 3-5 specs each, and placeholder images
- Setting rows: shipping { mode: "flat", cost: 50000, freeOver: 1000000 },
  contact info, and social links
- One admin user

Also write lib/db/ query modules (products.ts, categories.ts) with typed
functions — no Prisma calls will ever live in a component.

Run the migration and seed, verify with prisma studio, then stop.
```

---

## Prompt 2 — Layout shell

```
Read CLAUDE.md, then invoke my UI/UX design skill and follow it. Implement Phase 2 only. Study docs/references/reference design.png,
reference design2.png, reference design8.png and reference design10.png closely —
match their layout, not their colors.

Build:
- components/shop/Header.tsx — sticky, three zones. Start side: cart pill (teal,
  with item-count badge) that opens the cart dropdown from reference 10, and a
  phone widget that expands to show the number. Center: logo (an SVG wordmark
  you generate, placeholder name "تجهیزات پزشکی" with a tagline underneath).
  End side: search icon opening a search overlay, and a coral gradient
  ورود | ثبت نام pill.
- components/shop/MegaMenu.tsx — the nav bar under the header, driven by the
  seeded categories, with the multi-column dropdown panel from reference 2.
  Hover on desktop, tap on touch, keyboard accessible, closes on Escape.
- components/shop/MobileNav.tsx — a drawer replacing the mega-menu under 1024px.
- components/shop/TrustBadges.tsx — the six-card row from reference 8
  (ارسال فوری، پرداخت در محل، بهترین قیمت، تضمین اصالت کالا، مشاوره تخصصی،
  ۷ روز ضمانت برگشت کالا) with medical-palette icons.
- components/shop/Footer.tsx — social icon row, four link columns, a licence
  badge grid (empty placeholder slots for eNAMAD etc.), and a contact block with
  phone, Telegram, WhatsApp and address, all reading from Setting rows.
- components/shop/WhatsAppFab.tsx — the floating button.
- Wire all of it into app/(shop)/layout.tsx.

Every string comes from lib/i18n/fa.ts. Check 375px, 768px and 1440px before
you finish. Run the build, then stop.
```

---

## Prompt 3 — Home page

```
Read CLAUDE.md, then invoke my UI/UX design skill and follow it. Implement Phase 3 only. References: reference design.png,
reference design3.png, reference design10.png.

Build app/(shop)/page.tsx with these sections in order:

1. HeroSlider — full-width, rounded, 3 slides from a Setting row. Dark blue
   gradient mesh background with subtle medical cross/plus motifs (replacing the
   reference's neon hexagons), product image on one side, headline with a
   colored key phrase, and a teal خرید CTA. Autoplay with pause on hover, dots,
   prev/next arrows that flip correctly in RTL, and full keyboard support.
2. FloatingSearchBar — the white search card overlapping the bottom of the hero
   (reference 1). Submits to /search.
3. CategoryIconCards — the six circular-icon cards row, each linking to its
   category, horizontally scrollable on mobile.
4. ProductCarousel "جدیدترین محصولات" — cards showing image, name, price and
   star rating, with a hover state and arrow controls (reference 3).
5. ServiceCards — the four cards from reference 3, adapted: فروش اقساطی،
   درخواست مشاوره، فاکتور رسمی، چرا ما — each with a colored underline accent.
6. ProductCarousel "پرفروش‌ترین محصولات".
7. TrustBadges (already built in phase 2).

Data comes from the lib/db query modules; the page stays a Server Component with
only the sliders as client islands. Add loading skeletons. Build, check
responsiveness, then stop.
```

---

## Prompt 4 — Catalog *(start with /plan)*

```
Read CLAUDE.md, then invoke my UI/UX design skill and follow it. Implement Phase 4 only. References: reference design4.png,
reference design5.png, reference design7.png.

Plan first, show me the plan, then build:

1. app/(shop)/category/[slug]/page.tsx — breadcrumb, sidebar filters (price
   range slider, brand checkboxes, in-stock toggle, sub-category links), a sort
   dropdown (newest / cheapest / most expensive / best rated), a responsive
   product grid, and pagination. All filter state lives in the URL search params
   so results are shareable and the page stays a Server Component. Filters
   collapse into a bottom sheet on mobile.

2. app/(shop)/product/[slug]/page.tsx — the reference 4 layout, mirrored for RTL:
   - breadcrumb row with a share button
   - center: gallery with a thumbnail strip, zoom on hover, and a موجود /
     ناموجود stock badge
   - one side: purchase card — product name, total price, teal خرید button
     (adds to cart), outline مقایسه button (disabled placeholder for v1.1)
   - other side: highlights card — key specs, star rating, a coral مشاوره
     button that opens the phone/WhatsApp, and a ذخیره button (placeholder)
   - below: tabs — نقد و بررسی (rendered rich text, reference 5), مشخصات
     (grouped spec table, reference 7), نظرات (leave an empty placeholder
     component; phase 7 fills it)
   - a "محصولات جانبی" related-products carousel at the bottom
   - generateMetadata with Persian title/description and JSON-LD Product schema

3. app/(shop)/search/page.tsx — Postgres full-text search over name, brand and
   shortDesc, with the same grid and an empty state.

Build, test with the seeded data at 375px and 1440px, then stop.
```

---

## Prompt 5 — Cart & OTP auth

```
Read CLAUDE.md. Implement Phase 5 only. Reference: reference design9.png.

Cart:
- A Zustand store hydrated from the server, plus server actions add/update/remove.
- Guest carts keyed by an httpOnly cookie token; on login, merge the guest cart
  into the user's cart (sum quantities, cap at stock).
- app/(shop)/cart/page.tsx: line items with image, name, unit price, a quantity
  stepper bounded by stock, remove, and a sticky summary card with subtotal,
  a shipping line reading the Setting row, and total. Friendly empty state.
- The header cart dropdown from phase 2 now shows real data.

Auth (SMS OTP):
- lib/sms/ with an SmsProvider interface and two implementations: `console`
  (logs the code to the terminal — the development default) and `kavenegar`.
  Selected by the SMS_PROVIDER env var.
- app/(auth)/login/page.tsx matching reference 9: a single centered card, one
  field for phone or email, a coral تایید button. On submit, move to a 6-digit
  code step with a resend countdown and an edit-number link.
- Server actions requestOtp / verifyOtp. 6-digit code, 2-minute TTL, store only
  a hash, max 5 attempts, rate limit per phone AND per IP. Create the user on
  first successful verify. Issue a JWT in an httpOnly secure sameSite=lax cookie.
- middleware.ts protecting /account and /admin. logout action.
- app/(shop)/account/: profile, addresses CRUD, and an orders list placeholder.

Write tests for the OTP flow including the rate limit and expiry paths.
Build, verify you can log in end to end using the console code, then stop.
```

---

## Prompt 6 — Checkout, ZarinPal & orders *(start with /plan)*

```
Read CLAUDE.md. Implement Phase 6 only. Plan first.

1. lib/payment/ — a PaymentProvider interface { request(order): {redirectUrl,
   authority}, verify(authority, amount): {ok, refId} } with two
   implementations: `mock` (auto-approves, the development default) and
   `zarinpal` (sandbox toggled by ZARINPAL_SANDBOX). Selected by env var.

2. app/(shop)/checkout/page.tsx — address selection or a new-address form
   (province/city selects from a static Iran dataset you add to lib/data/),
   an order summary, and the shipping cost computed server-side from the
   Setting row (mode flat | free, cost, freeOver). Never trust client prices.

3. The order server action: inside a transaction, re-fetch every product,
   re-price the cart, verify stock, create Order + OrderItems with name and
   price snapshots, generate a human order number, create the Payment row, then
   redirect to the gateway.

4. app/(shop)/payment/callback/route.ts — verify server-side against the
   provider, and make it idempotent by authority so a refresh cannot double-pay.
   On success: mark paid, decrement stock, clear the cart. On failure: mark
   failed and restore the cart. Redirect to a result page either way.

5. app/(shop)/order/[orderNumber]/page.tsx — a confirmation and tracking page
   with a status timeline and Jalali dates, reachable by order number for guests
   and listed under /account/orders for logged-in users.

Test the full happy path and the failure path with the mock provider, then the
ZarinPal sandbox if credentials exist. Build, then stop.
```

---

## Prompt 7 — Reviews & ratings

```
Read CLAUDE.md, then invoke my UI/UX design skill. Implement Phase 7 only. Reference: reference design6.png.

Fill in the نظرات tab on the product page:
- A review form matching reference 6: نام, شماره همراه (optional, labelled
  "برای دیگران نمایش داده نمی‌شود"), a star rating input, and نظر شما, with a
  blue ارسال button. Zod-validated server action, honeypot + simple rate limit.
- New reviews are created with status PENDING and the user sees a clear
  "نظر شما پس از تایید نمایش داده می‌شود" message.
- Approved reviews list: author name, Jalali date, body, like/dislike counters
  with a voterKey cookie so one visitor votes once, and an ارسال پاسخ button
  producing threaded replies one level deep.
- Recompute Product.ratingAvg and ratingCount whenever a review is approved or
  removed; show the aggregate as stars on the product page and on product cards.
- Add a rating filter to the category sidebar.

Build, seed a few approved reviews so the UI is visible, then stop.
```

---

## Prompt 8 — Admin panel *(fresh session, start with /plan)*

```
Read CLAUDE.md and docs/ROADMAP.md, then invoke my UI/UX design skill and follow
it for the admin interface too. Implement Phase 8 only. This is the largest
phase — plan it and show me the plan before writing code.

Build /admin, protected by the role middleware, with its own LTR-agnostic but
still RTL Persian layout: a sidebar, a topbar and a content area, visually
simpler than the storefront.

- Dashboard: today's and this month's revenue, order counts by status, low-stock
  products, latest orders, pending reviews.
- Products: searchable and filterable table with pagination; create/edit form
  with multi-image upload to /public/uploads (validate type and size, generate
  a thumbnail), a specs repeater grouped by section, a rich-text description
  editor, category select, price/stock/SKU, and active/featured toggles.
  Bulk activate/deactivate and delete.
- Categories: tree view with drag-free ordering (sortOrder number), icon picker,
  create/edit/delete with a guard against deleting a category that has products.
- Orders: table filtered by status, detail view showing items, address snapshot,
  payment record, and a status changer that writes a timeline entry.
- Reviews: a moderation queue with approve/reject, which triggers the rating
  recompute.
- Users: list, search, and a role toggle.
- Settings: shipping rule (mode, cost, freeOver), contact details, social links,
  hero slides, and homepage section toggles — everything the owner must be able
  to change without a developer.

Every mutation is a Zod-validated server action with an optimistic-free,
explicit success/error toast. Build, click through every screen, then stop.
```

---

## Prompt 9 — Deployment & SEO

```
Read CLAUDE.md. Implement Phase 9 only.

I will give you my Ubuntu server details separately. Prepare everything that
does not need them yet:

- A deploy guide at docs/DEPLOY.md covering: Node LTS via nodesource,
  PostgreSQL install and a database/user, cloning, `npm ci`, `.env.production`,
  `prisma migrate deploy`, `npm run build`, a systemd unit (preferred) or PM2
  config, an Nginx reverse-proxy server block with gzip/brotli and correct
  proxy headers, Certbot TLS with auto-renew, and ufw rules.
- scripts/deploy.sh — pull, install, migrate, build, restart, health-check.
- scripts/backup.sh — nightly pg_dump plus an /public/uploads tarball, with
  rotation, and the cron line for it.
- A /api/health route returning DB connectivity.
- SEO pass: per-page generateMetadata in Persian, OpenGraph and Twitter tags,
  app/sitemap.ts covering products and categories, app/robots.ts, JSON-LD for
  Product and BreadcrumbList, and correct canonical URLs.
- Performance pass: audit next/image usage, add revalidation to catalog pages,
  check bundle size, and report Lighthouse scores for home, category and product.

Then stop and tell me exactly what you need from my server to finish.
```

---

## Prompts for later (v1.1 backlog)

Keep these until v1 is live: blog/مقالات section, product comparison page,
wishlist, coupon codes, province-based shipping zones, prescription-required
flags, bulk/wholesale pricing tiers, English translation.

---

## Session hygiene cheat sheet

- Invoke your UI/UX skill at the top of every design phase (0, 2, 3, 4, 7, 8).
- `/clear` between phases — the single biggest saving.
- `/plan` for phases 4, 6, 8.
- Paste failing output only, never whole logs.
- After each phase: `npm run build`, commit, `/clear`.
- Collect design tweaks in a note and spend one session on them, not ten.
