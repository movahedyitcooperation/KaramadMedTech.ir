# DESIGN.md — KaramadMedTech.ir storefront redesign

Design plan behind `KaramadMedTech.dc.html`. Decisions from §6 of the master prompt were answered by the owner; they are recorded here with reasoning.

## 1. Decisions taken (§6)

| # | Decision | Answer | Note |
|---|---|---|---|
| 1 | Currency unit | **Toman** | Confirmed by seed values (`price: 1250000`, `free_over: 1000000`) and ROADMAP. `formatToman()` is the sole formatting authority; no component prints a raw number. |
| 2 | Numerals | **Persian in prose, prices and spec values; Latin in SKU, phone, postal code** | Latin runs are wrapped in `direction:ltr; unicode-bidi:plaintext` so they don't reorder inside RTL text. |
| 3 | Token storage | **localStorage** | Accepted tradeoff: the 30-day JWT is readable by any script that achieves XSS on the origin, which the previous httpOnly-cookie + Next.js middleware architecture prevented. This is a real security downgrade, taken for implementation simplicity in a no-server frontend. Mitigations assumed: no third-party scripts on the origin, no `innerHTML` of API strings, CSP without `unsafe-inline` for scripts once deployed. Revisit if the backend ever gains a refresh-token endpoint that can set a cookie. |
| 4 | CTA treatment | **Deep ink (`#17211D`) carries every primary action; emerald is reserved for ground and state** | Coral had no basis in the new palette and terracotta/clay was ruled out. Rather than invent a warm third hue, the third "accent" is achromatic: near-black ink. Buy, submit and login all use it, so the primary action is the same object everywhere and never competes with the emerald surfaces it sits on. Emerald keeps two jobs only: the ground (header, footer, trust band, highlight cards) and the interactive/positive state (`#1C8A69` — focus ring, in-stock badge, hero rule, active dot). |
| 5 | Brand assets | **New type lockup** | Persian wordmark «کارآمد» at 800 weight with «تجهیزات پزشکی» as a subordinate line, next to a square outline holding a plain cross built from two rectangles. No illustration; the mark is type + two rules, so it survives at 38px and in one colour. |

## 2. Color

Six tokens, all verified against WCAG AA for the pairs actually used.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--ink` | `#17211D` | body text, **all primary CTAs**, cart badge | 13.1:1 on `--surface` |
| `--emerald` | `#0C3A2C` | ground: header, footer, trust band, highlight cards, section headings | `--bone` on it: 9.6:1 |
| `--emerald-deep` | `#082A20` | nav strip under the header (one step darker so the two bars separate without a border) | — |
| `--emerald-live` | `#1C8A69` | interactive/positive: focus ring, in-stock badge, hero rule, active slider dot, WhatsApp button | 3.4:1 on `--emerald` (non-text use + 4.6:1 for `--bone` text on it) |
| `--page` | `#EAE9E1` | page ground — almond, cool-shifted | — |
| `--surface` | `#F7F6F1` | cards, sidebar, panels | — |
| `--bone` | `#EAE9E1` | text on emerald | 9.6:1 |
| `--warn` | `#8A5A12` / `#FBF4E4` / `#E0CFA4` | low stock, clamped quantity, safety spec block, free-shipping hint | 5.1:1 on the pale warn ground |
| `--danger` | `#9E2B20` | discount badge, remove, OTP errors | 4.8:1 on `--surface` |

Almond was deliberately pushed **cool and powdery** (`#EAE9E1`, chroma ~0.006 green-yellow) rather than the warm-cream `#F4F1EA` that the brief flags as the commonest generated background. Two greens are present as required; the warning family is a desaturated ochre, not a red, so it never reads as an error next to the genuine `--danger` red.

## 3. Typography

- **Body and display: Vazirmatn only**, differentiated by weight and tracking rather than a second family — 800 with `-0.015em` tracking for display, 400/500/600 for text. Justification: a second Persian display family costs another WOFF2 request against a 60 KB JS / sub-2s LCP budget, and Vazirmatn's 800 weight is genuinely distinct from its 400 at the sizes used (h1 30–50px vs body 15–16px). Where a second family would earn its bytes is a logotype, and the logotype is one word.
- Scale: 50 / 33 / 32 / 27 / 24 / 19 / 16.5 / 15 / 14.5 / 13.5 / 12.5.
- Body 16px minimum in prose; line-height 1.75–1.95 (Persian needs more leading than Latin); measure capped at 52ch on product copy, 75ch max anywhere.
- No tracked-out all-caps eyebrows, no single-word colour accents in headlines, no `→` appended to links, no monospace data labels.

## 4. Layout concept

**One sentence:** an emerald ground that states what kind of shop this is, with almond work-surfaces where the buying actually happens — so the identity lives in the frame and the products live in the light.

```
HOME                                    (RTL: read right→left)
┌──────────────────────────────────────────────────────┐
│ EMERALD  [logo]  [finder pill............]  [tel][login][CART●]│
│ EMERALD-DEEP  دسته۱ دسته۲ دسته۳ دسته۴ دسته۵ دسته۶   │ ← mega panel drops
├──────────────────────────────────────────────────────┤
│ EMERALD   counter — kicker         │                 │
│           H1 (2 lines)             │   [ photo 4:3 ] │
│           │ highlight sentence     │                 │
│           [CTA ink-on-bone][ghost] │  ●▬ ●  ← → dots │
└───────────────────────────────┬──────────────────────┘
      ┌─ finder card overlaps ──┴──────────┐  ← the search slot, honest
      │ [category▾][price▾][sort▾][SHOW]   │
      └────────────────────────────────────┘
   ( ○ ) ( ○ ) ( ○ ) ( ○ ) ( ○ ) ( ○ )   six circular category cards
   جدیدترین محصولات                    [همه محصولات]
   [card][card][card][card][card]→        scroll-snap, no library
   ┌────┬────┬────┬────┐  four services, hairline-divided, ONE box
   پرفروش‌ترین محصولات
   [card][card][card][card][card]→
│ EMERALD  ارسال فوری │ پرداخت در محل │ … six trust cells │
│ EMERALD  footer: lockup+socials │ links │ links │ contact+badges │
```

```
CATEGORY                                PRODUCT DETAIL
breadcrumb                              breadcrumb            [share]
H1 + live count      [sort▾]            ┌──────────┬──────────────────┐
┌──────────┬────────────────────┐       │  photo   │ brand · stock    │
│ sidebar  │ [card][card][card] │       │  1:1     │ H1               │
│ subcats  │ [card][card][card] │       │ hover    │ short desc       │
│ price    │ [card][card][card] │       │ zoom     │ ┌──────────────┐ │
│ brands   │                    │       │          │ │ price  ink   │ │
│ in-stock │      ← ۱ ۲ →       │       │ [t][t][t]│ │ [−۱+][ BUY ] │ │
└──────────┴────────────────────┘       │          │ │ clamp notice │ │
sidebar is a single card, not            │          │ └──────────────┘ │
five stacked cards — 17 products         │          │ ┌ EMERALD ─────┐ │
don't warrant marketplace chrome         │          │ │ key specs dl │ │
                                        │          │ │ [tel][whats] │ │
                                        └──────────┴─┴──────────────┴─┘
                                        [نقد و بررسی][مشخصات][نظرات]
                                        specs: safety block first, then groups
                                        محصولات جانبی  [c][c][c][c]→
```

**Alignment logic:** one 1280px measure, 32px gutters (20px under 1024px). Everything aligns to the same start edge (right); prices, counts and totals align to the end edge in summary contexts only. The hero's two columns are the only place a 1.05/0.95 split appears — everywhere else it's equal columns or a fixed 268px/372px rail.

**Three card jobs, three treatments** (the brief's warning about one radius everywhere):
- **Product card** — 4px radius, hairline border, full-bleed photo, border darkens on hover. The photo is the card.
- **Service card** — no individual card at all: four cells inside one 10px-radius box divided by hairlines. They are a set, so they read as a set.
- **Trust badge** — no card, no radius: six cells on the emerald band separated by 1px rules. Structure, not object.
- **Highlight card** (PDP key specs, cart terminal state, mega-menu panel) — emerald ground, 8px radius, reversed text. Used where the site is speaking rather than listing.

## 5. Motion

Spent in one place: **the hero**. Changing slide re-keys the text column and its four children stagger up (22ms apart, `transform`/`opacity` only). Autoplay is 6.5s, pauses on hover, and does not run under `prefers-reduced-motion`.

Everything else is response to action, never decoration: mega-menu and cart-dropdown drop-in (160–180ms), drawer slide, toast rise, quantity/qty-clamp text, PDP image hover zoom, product-card border darkening. That is three patterns — stagger, drop-in, and a 200ms property fade. No section reveal on scroll, no card hover-lift.

## 6. Principles

1. **The catalog is 17 products, not 17,000.** Filters are one sidebar card, brands are derived from what's actually in the result set, and categories get 76px circles instead of a dense facet rail. Nothing pretends to be a marketplace.
2. **Two audiences, one card.** A ۹۵٬۰۰۰-toman battery pack and an ۸۹-million-toman autoclave use the identical card and identical price treatment. No "premium" styling tier, because the person buying a cane and the person buying a sterilizer are both buying equipment.
3. **Say the real state.** Stock badges show `stock`, low stock says the number, clamps announce themselves in words, and the funnel says out loud that online payment isn't live yet.
4. **Emerald is the building, ink is the button.** The palette identifies the shop; the CTA never has to compete with it.
5. **RTL is the native direction.** Composed right-to-left from the first element; logical properties only; carousel arrows and pagination chevrons flip, cart/search/check do not.

## 7. What changed from the old design, and why

| Old | Now | Why |
|---|---|---|
| Layout copied from a projector-retailer reference | Rebuilt around six medical categories | The reference's subject matter had nothing to do with clinical purchasing. The hero now opens on the actual objects (an equipped exam surface, a home-care table, a consumables set) instead of a decorative field. |
| Dark-blue gradient mesh hero + neon-hexagon/medical-cross motifs | Flat emerald ground, real photograph, staggered text | The motifs were a patch on a borrowed idea. A photograph of the equipment is the most characteristic thing this world has. |
| Coral gradient login pill, teal buy buttons | Single ink CTA everywhere (§6.4) | Emerald + almond contain no coral; terracotta/clay is an AI tell. One achromatic CTA is defensible and consistent. |
| `hero_slides.highlight` coloured inside the headline | `highlight` promoted to its own 19px sentence with a 2px emerald rule at the start edge | Colour-accenting one phrase is the flagged tell. The API field still drives the same content and gets *more* weight, not less. |
| Blue/teal/coral | Emerald ground + almond surface + ink CTA + ochre warn + red danger | Palette change per brief; every dependent decision re-derived rather than recoloured. |
| Faceted marketplace sidebar | One sidebar card, brand facet labelled "برندهای موجود در نتایج همین دسته" | There is no brands endpoint and there are 17 products. Presenting an exhaustive facet would be a lie about both. |
| Text search bar (silently non-functional) | Category + price + sort **finder** with a one-line explanation | §5 gap 2. The visual slot is kept; the promise is changed to one the backend can keep. |
| camelCase TS types + conversion layer | snake_case consumed directly | Adapter deleted per brief. |
| Zustand store, Server Actions, middleware cart cookie | Module state + subscribe/notify; browser-minted `X-Guest-Cart-Token`; client auth guard | Stack change; see the table in §1 of the master prompt. |
| مقایسه / ذخیره placeholders | Kept, still disabled, now labelled «به‌زودی» | Honest about the gap rather than a dead-looking control. |

## 8. Plan critique (§13.3) — what the generic version would have looked like, and what changed

Running the brief as generic e-commerce produced: full-width photo hero with an overlay headline; four-across category tiles; three product carousels; identical rounded cards with a soft grey shadow throughout; sticky filter rail with five collapsible facet groups and a rating filter; hover-lift on every card; fade-up on every section; a green "Add to cart" button. Where that landed, and what was revised:

1. **Cards were all one object.** Revised into the four distinct treatments in §4 — product, service (hairline set), trust (rules only), highlight (emerald reversed). A shadow appears exactly twice in the design (the finder card lifting off the hero, and the cart dropdown), both to signal "floating above", never as card decoration.
2. **The filter rail was marketplace-scale.** Revised to one card with four controls, and the rating filter dropped entirely — there is no rating filter in the API and 17 products don't need one.
3. **Motion was everywhere.** Revised to the hero stagger plus action-response only; the generic scroll-reveal and hover-lift were removed outright.
4. **CTA was "the green button".** Revised to ink, which also freed emerald to do the ground work the brief demands — the generic version wasted the palette on a button.
5. **The hero was an overlay-on-photo.** Revised to a two-column split, because the API gives `title` + `highlight` + `cta_label` as *text* and no image URL: real Persian sentences at 19px are unreadable over a photograph, and the frontend owns the imagery anyway.
6. **What survived unchanged, deliberately:** the §2 section inventory, scroll-snap carousels, breadcrumbs, three-tab PDP, sticky cart summary. These are conventions users already know; spending novelty there would cost comprehension for nothing.

Where the brief pinned an axis — emerald/almond, RTL, vanilla JS, speed, 17 products, the §2 inventory — it was followed exactly. Where it left one free (card treatments, motion budget, the finder's copy, the safety-spec block, the terminal cart state) the freedom was spent on something specific to clinical purchasing rather than on a default.

## 9. Prototype scope vs. the shipping build

This Design Component is the **visual and interaction specification**: every §2 section, all three async states, real clamp behaviour, the 120-second resend countdown, all keyboard/`aria` structure, and the honest terminal state. Data is a fixture shaped exactly like the API contract in §4 (snake_case, `description` as a paragraph array, `specs` flat with `group`, cart lines keyed by `product_id`, `unit_price` with no snapshot and no totals) so the vanilla-JS port replaces the fixture with `api/client.js` and changes nothing else structurally.

Not yet in the prototype, and required for the shipping build: the real `fa.js` extraction (strings are currently module constants in the same file), the subsetted self-hosted Vazirmatn WOFF2, `srcset`/`sizes` on every image, `sessionStorage` list caching with TTL, `AbortController` on filter changes, the mobile filter bottom sheet, the add-address form, JSON-LD, `sitemap.xml`/`robots.txt`, and the measured Lighthouse run. Images here are the owner-supplied photographs at their native size — the shipping build must resize them per breakpoint, and the backend must gain cache headers (see BACKEND-GAPS.md).
