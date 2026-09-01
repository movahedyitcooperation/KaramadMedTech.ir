# BACKEND-GAPS.md

What the FastAPI backend does not support, how the frontend behaves instead, and what to add first. Nothing here is worked around by faking data.

## Ranked by value of adding it

| # | Gap | Frontend behaviour now | Cost to add |
|---|---|---|---|
| 1 | **No product search** — no `q` param, no full-text index (`ROADMAP` Phase 4, never implemented) | The floating search slot is a **finder**: category + price band + sort, submitting to the normal `/products/` filter params, with a visible line — «جست‌وجوی متنی هنوز فعال نیست؛ فعلاً کالا را با دسته‌بندی و قیمت پیدا کنید». The dedicated search-results page is **not built**. | Small. A `q` param doing `ILIKE` on `name`/`brand`/`short_desc` unlocks the search bar and the results page immediately; a Postgres `tsvector` + GIN index is the proper version. **Highest-value single addition available.** |
| 2 | **No checkout, orders or payment** — `models/order.py`, `order_item.py`, `api/v1/orders.py`, `payments.py` are Phase 6 stubs, not registered in `router.py` | The funnel is complete and correct **up to the cart**. The cart summary card computes subtotal, shipping (flat `cost`, waived at `free_over`) and total from live `unit_price`, and is followed by a designed terminal card: order finalised by WhatsApp or phone from `settings.contact`. No fake checkout, no stubbed endpoint, no client-held order state. The account **سفارش‌ها** tab is a designed empty state. | Large (orders, order items, ZarinPal, stock decrement, invoice numbering). The cart summary is laid out so a real checkout step drops in below it without a rewrite. |
| 3 | **No brands endpoint** | The sidebar brand facet is derived from brands present in the loaded result set for that category, and is labelled «برندهای موجود در نتایج همین دسته» so it is not presented as exhaustive. Filtering uses `?brands=` exact match, as the API requires. | Trivial: `GET /brands/`, or `DISTINCT brand` returned alongside `ProductListResult` as a facet block (better — one round trip). |
| 4 | **No review submission** — `review.py` is a Phase 7 stub; `rating_avg`/`rating_count` are display-only seeded values | Stars and counts render on cards and the detail page. The **نظرات** tab is a designed empty state explaining the rating is the shop's own assessment and inviting the note by WhatsApp — not a form that posts nowhere. No rating filter in the sidebar, because there is no rating filter param. | Medium (submission, moderation, recompute of `rating_avg`). |
| 5 | **`is_featured` is not a query param** — it exists on `ProductRead` but isn't filterable | The پرفروش‌ترین carousel fetches a page and filters client-side. Cheap at 17 products; wrong at 400. | Trivial: add `is_featured: bool` to `/products/`. Do it before the catalog grows. |
| 6 | **No wishlist, coupons, comparison or stock reservation** | مقایسه and ذخیره stay visible and disabled, labelled «به‌زودی». Not wired to anything. | Out of scope for v1. |

## Infrastructure findings — these belong to the backend, not the frontend

Both are the highest-leverage performance fixes available and neither can be solved from the browser.

1. **`/api/v1/uploads/` sends no cache headers.** The Nginx config gzips text but sets no `expires` on the uploads `StaticFiles` mount, so every product image is re-downloaded on every navigation. Add `expires 1y; add_header Cache-Control "public, immutable";` (content-addressed UUID filenames make this safe).
2. **Uploads are stored verbatim, up to 5 MB, with no resize or format conversion** (`admin_uploads.py`). A 4 MB PNG of an autoclave destroys LCP on an Iranian mobile connection, and no amount of frontend `srcset` fixes a single 4 MB original. Add a Pillow step on upload: cap the long edge (~1600px), emit WebP or AVIF plus a JPEG fallback at 3–4 widths, and return the variant URLs on `ProductImage` so the frontend can build a real `srcset`.

Frontend mitigations applied meanwhile: explicit `width`/`height` on every image (CLS protection), `loading="lazy"` below the fold, `fetchpriority="high"` on the hero image only, and a flat placeholder colour behind each image so no layout shift or flash occurs while it loads.

## Schema limits noted, not worked around

- **No dedicated fields for IRC code, expiry, sterility, batch or storage temperature.** Everything domain-specific is a `specs` row (`group`/`key`/`value` strings). The frontend therefore groups `specs` by `group` preserving first-seen order, and additionally surfaces safety-relevant keys (وضعیت سترون، تاریخ انقضا، شرایط نگهداری، دمای نگهداری، کد IRC، ضدعفونی) in a pale-warn block **above** the spec table, so they are reachable on mobile without scrolling the whole table. No UI was invented for fields the schema lacks. If these become first-class fields, the block becomes a real component rather than a key-name match.
- **`category_id` is a UUID, not a slug**, so `/categories/` is fetched once at boot and kept as an id→category index for breadcrumbs.
- **The category tree is exactly two levels** (single `selectinload`, not a recursive CTE). The mega-menu panel therefore shows one level of children and no more; it is not built to recurse.
- **`hero_slides` carries `image_alt` but no image URL.** Hero imagery is the frontend's, keyed by slide `id`, with the API's `image_alt` used as the `alt` text.
- **`CartRead` has no price snapshot and no totals.** `unit_price` is joined fresh on every read and can change between add and view; subtotal, shipping and total are always computed from the latest response plus `settings.shipping`, never from cached state.
- **Quantity is silently clamped to stock** (`min(qty, stock)` on add, `max(1, min(qty, stock))` on update). The requested quantity is compared against the response and any difference is announced in words («فقط ۳ عدد موجود بود؛ همان تعداد به سبد اضافه شد») through an `aria-live` region. Optimistic updates reconcile against the response, never assume it won.
- **Phone and email are separate identities.** Verifying by phone and later by email creates two unrelated accounts with separate carts and addresses. The login card says so, in one line, rather than implying they merge.
- **Only `full_name` is editable on `/account/me`.** Phone and email render as read-only values with a line explaining they are the login identity.
