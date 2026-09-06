# BACKEND-GAPS.md

What the FastAPI backend does not support, how the storefront behaves instead,
and what to add first.

Nothing in this list is worked around with fake data. Where a feature does not
exist, the UI says so in words rather than rendering an empty shell that looks
broken or — worse — a control that posts nowhere.

Adapted from the design branch's own gap analysis and re-verified against
`backend/app/api/v1/` at the time of the design port.

## Ranked by value of adding it

| # | Gap | Frontend behaviour now | Cost to add |
|---|---|---|---|
| 1 | **No product search.** `/products/` has no `q` param and there is no full-text index. | The header's wide control is a **finder**, not a search box: it scrolls to the home finder card, which composes category + price band + sort and submits to the normal category listing. A visible line says so: «جست‌وجوی متنی هنوز فعال نیست؛ فعلاً کالا را با دسته‌بندی و قیمت پیدا کنید». The `/search` route has been removed — a results page and that sentence cannot both be true. | Small. A `q` param doing `ILIKE` on `name`/`brand`/`short_desc` unlocks a real search bar and results page immediately; a Postgres `tsvector` + GIN index is the proper version. **Highest-value single addition available.** |
| 2 | **No checkout, orders or payment.** `models/order.py`, `order_item.py`, `api/v1/orders.py` and `payments.py` exist as Phase 6 stubs and are deliberately *not* included in `api/v1/router.py`. | The funnel is complete and correct **up to the cart**. The cart summary computes subtotal, shipping (flat `cost`, waived at `free_over`) and total from live `unit_price` plus `GET /settings/`, and is followed by a designed terminal card: the order is finalised by WhatsApp or phone from `settings.contact`. No fake checkout button, no stubbed endpoint, no client-held order state. The account's **سفارش‌ها** tab is a designed empty state that explains this. | Large (orders, order items, ZarinPal, stock decrement, invoice numbering). The cart summary is laid out so a real checkout step drops in below it without a rewrite. |
| 3 | **No brands endpoint and no facet block on `ProductListResult`.** | The sidebar's brand facet is derived from the products in that category (`lib/db/products.ts`'s `getBrandFacet`) and is labelled «برندهای موجود در نتایج همین دسته», so it is not presented as exhaustive. Filtering itself uses the real `?brands=` repeated param. | Trivial: `GET /brands/`, or better, return `DISTINCT brand` alongside `ProductListResult` as a facet block — one round trip instead of two. |
| 4 | **No review submission.** `models/review.py` is a Phase 7 stub; `rating_avg`/`rating_count` are display-only seeded values. | Stars and the score render on cards and the PDP, described in words as the shop's own assessment («امتیاز کارشناسی ۴٫۶ از ۵»). The review **count** is not shown anywhere, because it would imply reviews that do not exist. The **نظرات** tab is a designed empty state inviting the note by WhatsApp — not a form that posts nowhere. There is no rating filter in the sidebar, because there is no rating filter param. | Medium (submission, moderation, recompute of `rating_avg`). |
| 5 | **`is_featured` is not a query param** — it exists on `ProductRead` but isn't filterable. | The پرفروش‌ترین rail fetches one page sorted by rating and filters client-side (`getFeaturedProducts`). Cheap at 15 products, wrong at 400. | Trivial: add `is_featured: bool \| None = Query(None)` to `/products/`. Do it before the catalog grows; `getFeaturedProducts` is the only caller that changes. |
| 6 | **No product count on the category tree.** | The home rail's «۵ کالا» line and the sidebar's sub-category counts each cost one `page_size=1` request whose only useful field is `total` (`countProductsInCategory`). Six to ten cheap COUNTs per page against a loopback backend. | Trivial: a `product_count` on `CategoryTree`, or a `count` facet on `ProductListResult`. |
| 7 | **No wishlist, coupons, comparison or stock reservation.** | مقایسه and ذخیره stay visible, disabled, and labelled «به‌زودی». They are not wired to anything. | Out of scope for v1. |

## Infrastructure findings — backend-side, not solvable from the browser

1. **`/api/v1/uploads/` sends no cache headers.** The Nginx config gzips text
   but sets no `expires` on the uploads `StaticFiles` mount, so an
   admin-uploaded product image is re-downloaded on every navigation. Add
   `expires 1y; add_header Cache-Control "public, immutable";` — the
   content-addressed UUID filenames make that safe.
2. **Uploads are stored verbatim, up to 5 MB, with no resize or format
   conversion** (`admin_uploads.py`). A 4 MB PNG of an autoclave destroys LCP
   on an Iranian mobile connection, and no amount of frontend `srcset` fixes a
   4 MB original. Add a Pillow step on upload: cap the long edge (~1600px),
   emit WebP plus a JPEG fallback at 3–4 widths, and return the variant URLs on
   `ProductImage`.

   Mitigated for now by `next/image`, which resizes and re-encodes on demand —
   but that moves the cost to the Node process rather than removing it.

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
  recursive CTE). The nav panel shows one level of children and no more.
- **Phone and email are separate identities.** Verifying by one and later by
  the other creates two unrelated accounts with separate carts and addresses;
  there is no cross-channel merge. The login card says so in one line rather
  than implying they merge.
- **Only `full_name` is editable on `PATCH /account/me`.** Phone and email
  render as read-only values with a line explaining they are the login
  identity.
