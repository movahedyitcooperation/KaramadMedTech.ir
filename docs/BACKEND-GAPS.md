# BACKEND-GAPS.md

What the FastAPI backend does not support, how the storefront behaves instead,
and what to add first.

Nothing in this list is worked around with fake data. Where a feature does not
exist, the UI says so in words rather than rendering an empty shell that looks
broken or — worse — a control that posts nowhere.

## Resolved

These were gaps when the design was ported; they are now implemented. Kept
here (rather than deleted) so the reasoning behind the current shape is still
findable.

### ✅ Product search — `GET /products/?q=`

Was: no `q` param, no index. The storefront had no results page and said so.

Now: full-text-ish search over `name`, `brand`, `short_desc` and `sku`, applied
in SQL. See `backend/app/core/search.py` for the Persian handling and
`backend/tests/test_search.py` for what is guaranteed.

- **Persian normalisation.** Postgres ships no Persian text-search
  configuration, so `to_tsvector('persian', …)` does not exist and a stemmer is
  out of reach. Instead one `translate()` table folds the variants that
  actually differ in the wild — Arabic Yeh/Kaf (ي/ك) to Persian (ی/ک), alef
  and teh-marbuta variants, ZWNJ to a space, Persian and Arabic-Indic digits to
  ASCII, tatweel and harakat removed — and the same table is applied to both
  the query (in Python) and the column (in SQL). A test asserts the two agree
  character for character, because a drift between them would silently stop
  matching rows.
- **Tokens are ANDed, substring within each**, so «فشارسنج امرن» matches
  regardless of word order, and a partial word still matches.
- **Index**: migration `0004` creates a `pg_trgm` GIN index over the exact
  normalised expression the query uses. `pg_trgm` is a core contrib module
  (Debian/Ubuntu: `postgresql-contrib`); where it is unavailable the migration
  logs and skips, and search still works via a sequential scan. **Check the
  index exists after deploying** — see `docs/DEPLOY.md`.
- Composes with every other filter, with paging, and with `include_facets`.

Remaining nuance: matching is substring-based, so it does not do stemming,
plural folding or fuzzy/typo tolerance. `pg_trgm` similarity ranking would be
the next step if shoppers start mistyping product names.

### ✅ `is_featured` as a query param

Was: filterable only by fetching a page and dropping rows in JS.

Now: `GET /products/?is_featured=true` filters in SQL. `getFeaturedProducts`
requests exactly the rows it renders. Omitting the param returns both, so the
change is backward compatible.

### ✅ Facet counts — `GET /products/?include_facets=true`

Was: no counts anywhere, so the home rail and the category sidebar issued one
`COUNT` per category — an N+1 that would grow with the tree.

Now: an optional `facets` block on `ProductListResult` carrying `brands`,
`categories` (top-level departments), `subcategories` (children of the
selected department), `in_stock`, and `price_min`/`price_max`.

- **Fixed query count.** Five aggregates over one shared filtered subquery, no
  matter how many products, brands or categories exist.
- **Each facet drops its own dimension.** With `brands=Omron` checked, the
  brand facet still lists Beurer and its count, while the category facet
  already reflects the Omron narrowing. That is what makes the numbers useful
  rather than a tautology.
- **Opt-in.** Absent unless requested, so the home carousels and the PDP's
  related rail pay nothing for aggregates they never read.

### ✅ Checkout, orders & payment — backend

Was: `models/order.py`, `order_item.py`, `api/v1/orders.py` and `payments.py`
existed as Phase 6 stubs, deliberately excluded from `api/v1/router.py`.

Now: `POST /orders/` re-validates every cart line against live
`is_active`/`stock`, prices from the live `unit_price` (never a cart
snapshot), decrements stock via an atomic conditional `UPDATE … WHERE stock
>= qty` (so two concurrent checkouts can't oversell), and snapshots
product name/sku/price onto `OrderItem` at order time. `GET /orders/` and
`GET /orders/{id}` are ownership-checked and paginated. A `PaymentProvider`
interface (`app/core/payment.py`) has both a `mock` (auto-approves, dev
default) and a real `zarinpal` implementation — `POST /payments/request` +
`GET /payments/callback`, the latter idempotent on ZarinPal's own
`authority` so a repeated callback call can't double-verify or double-mark
an order paid. `GET/PATCH /admin/orders/` gives the admin panel visibility
into every customer's orders and a status lifecycle
(`pending_payment → paid → processing → shipped → delivered`, or
`→ cancelled` from any non-terminal status, which restocks the order's
items). `OrderRead.created_at` and a unique-per-attempt mock authority
(`MOCK-{order_number}-{n}`, not the original branch's deterministic
`MOCK-{order_number}`) were both fixed while merging in the storefront UI
below, which is what actually exercised them.

### ✅ Checkout, payment and order history — the storefront UI

Was: the backend's Phase 6 endpoints existed and worked, but nothing in the
storefront called them. The cart ended in a «پرداخت آنلاین به‌زودی» card, the
account's **سفارش‌ها** tab was an empty state that could never fill, and the
`payment_url` the mock provider returns pointed at `/checkout/mock-pay` — a
route the frontend did not have, so a mock checkout 404'd.

Now: the funnel runs end to end, entirely against the existing endpoints. No
backend file was changed to build it.

- `/checkout` — address selection plus an order preview. The totals shown are
  computed here for display only; `POST /orders/` recomputes subtotal,
  shipping and total from live product rows, and the order carries the
  backend's figures.
- **Order creation and payment initiation are two calls, deliberately not
  merged.** `POST /orders/` is the point of no return: it decrements stock and
  empties the cart. `POST /payments/request` only asks for a URL. If the
  gateway request fails, the order survives in `pending_payment` and is
  payable from its own page — merging them would let a gateway hiccup lose the
  basket.
- `/checkout/mock-pay` — the dev stand-in for the bank, matching
  `MockPaymentProvider`'s `payment_url`. Its two buttons are plain links to
  the backend's public callback with `Status=OK`/`NOK`, exactly what ZarinPal
  would call. It `notFound()`s outside development, so a production deploy
  cannot expose a one-click "mark my order paid" route.
- `/orders/[id]` — the destination of the backend's post-payment redirect. It
  renders the `?payment=success|failed|cancelled` verdict as a banner **next
  to the order's own status badge**, so a stale or hand-typed query string
  cannot make an unpaid order look paid. A `pending_payment` order offers a
  retry.
- `/account?tab=orders` — the real list, from `GET /orders/`.
- `/orders` (no id) forwards to that tab; `/checkout` and `/orders` joined
  `/account` in middleware's customer gate, carrying `next` so a login never
  costs a shopper their place in the funnel.

Two backend bugs this UI work exposed, both fixed in the same pass (not left
open below): the mock payment provider used a deterministic
`MOCK-{order_number}` authority against a `unique=True` column, so retrying a
cancelled mock payment 500'd on the second `POST /payments/request` — fixed
by making the mock authority unique per attempt. And `OrderRead` had no
`created_at`, so the order history and order page had no dates to show —
fixed by adding it (both `OrderRead` and the admin variant inherit it now).

### ✅ Review submission & moderation — backend

Was: `models/review.py` was a Phase 7 stub; `rating_avg`/`rating_count` were
display-only seeded values with nothing behind them.

Now: `POST /reviews/` accepts a public, unauthenticated submission (reviewer
name, optional phone collected for the shop's own follow-up and never
displayed, a 1–5 rating, body text), lands as `status="pending"`, and is
rate-limited per IP (`REVIEW_MAX_SUBMISSIONS_PER_IP_PER_HOUR`, mirroring
OTP's own per-contact/per-IP pattern). `GET /reviews/?product_id=` is public
and returns `approved` rows only — never by a caller-passed filter, by
construction, since the route has no `?status=` param at all. `GET/PATCH
/admin/reviews/` gives the admin panel a moderation queue (filterable by
status); approving or rejecting a review recomputes the product's
`rating_avg`/`rating_count` from scratch off every currently-`approved` row
for that product, so a moderator flip-flopping a review's status can never
drift the aggregate out of sync with what's actually approved.

Remaining gap, now frontend-only: `RatingRow.tsx`'s own comment ("there is no
review system... a count would imply reviews that don't exist") is stale —
there's a real review system now. The PDP's **نظرات** tab is still the
designed empty state pointing to WhatsApp instead of a submission form, and
the product card/PDP rating still renders the shop's seeded "expert
assessment" framing rather than a real review count. Wiring the storefront to
these endpoints (a review form, the نظرات list, and updating the rating copy
once real reviews exist for a product) is a frontend task, not a backend one.

## Still open, ranked by value of adding it

| # | Gap | Frontend behaviour now | Cost to add |
|---|---|---|---|
| 1 | **No wishlist, coupons, comparison or stock reservation.** | مقایسه and ذخیره stay visible, disabled, and labelled «به‌زودی». They are not wired to anything. | Out of scope for v1. |

## Infrastructure findings — backend-side, not solvable from the browser

### ✅ `/api/v1/uploads/` cache headers

Was: no `Cache-Control` at all, so an admin-uploaded product image was
re-downloaded on every storefront navigation.

Now: `app/core/static.py`'s `CacheableStaticFiles` (a small `StaticFiles`
subclass overriding `file_response`) sets `Cache-Control: public,
max-age=31536000, immutable` on every response through the `/api/v1/uploads/`
mount — a backend-code fix rather than an Nginx config change, so it holds in
local dev too, not just behind production's reverse proxy. Safe specifically
because `admin_uploads.py` names every upload with a content-addressed UUID
filename that's never reused or overwritten in place. Conditional requests
(`If-None-Match` → `304`) still work — verified directly against a real
uploaded file.

### ✅ Upload resize & re-encode

Was: uploads were stored verbatim, up to 5 MB, with no resize or format
conversion. A 4 MB PNG of an autoclave destroys LCP on an Iranian mobile
connection.

Now: `admin_uploads.py`'s `_process_image` (Pillow, approved as a new
dependency per §9 — the only one in this codebase) re-encodes every accepted
upload to a single size-capped WebP: long edge clamped to 1600px (matching
the storefront's own pre-optimised hero art), quality 82, alpha preserved
for a transparent PNG rather than flattened onto a background it never had.
Runs via `asyncio.to_thread` so the CPU-bound decode/resize/encode never
blocks the event loop.

**Deliberately a single re-encoded original, not a multi-width variant set**
(`ProductImage` unchanged, still one `url` per image) — `next/image` already
resizes and re-encodes to AVIF/WebP on demand per viewport; what it lacked
was a sane *starting point*, not more variants to choose from. A raw 4 MB
phone photo is now `next/image` working from a WebP source under 1600px
instead. This fix has zero effect on the frontend or `ProductImage`'s shape —
no coordination needed with whoever picks up the storefront next.

This is also a real content-verification step, not just optimization:
`Image.open(...).load()` inside a `try` means the Content-Type header (which
is caller-supplied and unverified) is no longer trusted on its own — a file
that claims `image/png` but isn't a decodable image now gets a `415`, and
Pillow's own `Image.MAX_IMAGE_PIXELS` guard (left at its default) rejects a
decompression-bomb-sized image before it gets near a resize. Verified: a
3200×2400 PNG uploaded through the real endpoint came back as a 1600×1200
WebP; a corrupt file with a spoofed `image/png` header was rejected; alpha
survived a transparent PNG round-trip. 8 new tests cover all of this.

## Schema limits noted, not worked around

- **No dedicated fields for IRC code, expiry, sterility, batch or storage
  temperature.** Everything domain-specific is a `specs` row
  (`group`/`key`/`value` strings). `ProductTabs` therefore groups specs by
  `group` preserving first-seen order, and additionally lifts safety-relevant
  *key names* (وضعیت سترون، تاریخ انقضا، شرایط نگهداری، دمای نگهداری، کد IRC،
  ضدعفونی) into a pale-warn block above the spec table, so they are reachable
  on a phone without scrolling the whole table. No UI was invented for fields
  the schema lacks; if these become first-class columns, that block reads them
  directly instead of matching on key names.
- **`hero_slides` carries `image_alt` but no image URL**, so hero photography
  is frontend-owned and keyed by slide id in `HeroSlider`.
- **`hero_slides.highlight` is a phrase *inside* `title`** in the seeded data
  («تضمین اصالت» within «تجهیزات پزشکی با تضمین اصالت…»), whereas the design
  uses it as a separate supporting line under a rule. `HeroSlider` renders it
  as the supporting line when it is standalone, and marks it in place inside
  the headline when it is a substring — so the same words never appear twice.
  A separate `subtitle` field on `HeroSlide` would let the design's intended
  two-line hero render as authored.
- **`CartRead` has no price snapshot and no totals.** `unit_price` is joined
  fresh on every read and can change between adding and viewing, so subtotal,
  shipping and total are always computed from the latest response plus
  `settings.shipping` — never from cached state.
- **Quantity is silently clamped to stock** (`min(qty, stock)` on add,
  `max(1, min(qty, stock))` on update). The requested quantity is compared
  against the response and any difference is announced in words
  («فقط ۳ عدد موجود بود؛ همان تعداد به سبد اضافه شد») through the toast queue.
- **`category_id` is a UUID, not a slug**, so `GET /categories/` is fetched and
  indexed by id wherever a product needs to name its category.
- **The category tree is exactly two levels** (a single `selectinload`, not a
  recursive CTE). The nav panel shows one level of children and no more, and
  the `subcategories` facet folds on that assumption.
- **Phone and email are separate identities.** Verifying by one and later by
  the other creates two unrelated accounts with separate carts and addresses;
  there is no cross-channel merge. The login card says so in one line rather
  than implying they merge.
- **Only `full_name` is editable on `PATCH /account/me`.** Phone and email
  render as read-only values with a line explaining they are the login
  identity.
