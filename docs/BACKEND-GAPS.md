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

## Still open, ranked by value of adding it

| # | Gap | Frontend behaviour now | Cost to add |
|---|---|---|---|
| 1 | **The mock payment provider cannot be paid twice for one order.** `MockPaymentProvider.request_payment` returns a deterministic `authority` of `MOCK-{order_number}`, but `payments.authority` is `unique=True` — so a second `POST /payments/request` for the same order raises an IntegrityError and the endpoint 500s. Real ZarinPal is unaffected: it mints a fresh authority per request. | The retry button on a `pending_payment` order works against ZarinPal but fails against the mock provider, showing the generic server-error sentence. Reproduced on the local stack: cancel a mock payment, then press «پرداخت سفارش». | Tiny, backend-only: make the mock authority unique per attempt (e.g. append a short random suffix or the attempt count). Worth doing because the mock provider is exactly what dev and staging use to test the retry path. |
| 2 | **`OrderRead` exposes no `created_at`.** The model has the column; the schema does not return it. | The order history and the order page show no dates at all — the order number is the only chronological cue, and the backend's newest-first ordering is the only thing keeping the list sensible. Nothing is invented to fill the gap. | Trivial, backend-only: add `created_at` to `OrderRead`. Purely additive, no existing consumer breaks. |

| 3 | **No review submission.** `models/review.py` is a Phase 7 stub; `rating_avg`/`rating_count` are display-only seeded values. | Stars and the score render on cards and the PDP, described in words as the shop's own assessment («امتیاز کارشناسی ۴٫۶ از ۵»). The review **count** is not shown anywhere, because it would imply reviews that do not exist. The **نظرات** tab is a designed empty state inviting the note by WhatsApp — not a form that posts nowhere. There is no rating filter in the sidebar, because there is no rating filter param. | Medium (submission, moderation, recompute of `rating_avg`). |
| 4 | **No wishlist, coupons, comparison or stock reservation.** | مقایسه and ذخیره stay visible, disabled, and labelled «به‌زودی». They are not wired to anything. | Out of scope for v1. |

## Infrastructure findings — backend-side, not solvable from the browser

1. **`/api/v1/uploads/` sends no cache headers.** The Nginx config gzips text
   but sets no `expires` on the uploads `StaticFiles` mount, so an
   admin-uploaded product image is re-downloaded on every navigation. Add
   `expires 1y; add_header Cache-Control "public, immutable";` — the
   content-addressed UUID filenames make that safe.
2. **Uploads are stored verbatim, up to 5 MB, with no resize or format
   conversion** (`admin_uploads.py`). A 4 MB PNG of an autoclave destroys LCP
   on an Iranian mobile connection. Add a Pillow step on upload: cap the long
   edge (~1600px), emit WebP plus a JPEG fallback at 3–4 widths, and return the
   variant URLs on `ProductImage`.

   Mitigated for now by `next/image`, which resizes and re-encodes to
   AVIF/WebP on demand — but that moves the cost to the Node process rather
   than removing it, and the first request for each variant pays the encode.
   The storefront's own hero art is already pre-optimised at build time
   (1600px WebP sources, ~35–120 KB each) precisely so the optimizer starts
   from something sane; admin uploads should get the same treatment.

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
