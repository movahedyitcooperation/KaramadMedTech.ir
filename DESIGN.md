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

## 2·b. Department wayfinding spectrum + `--info` (colorize pass, 2026-09)

The six-token core above is unchanged: **`--ink` is still the only CTA, `--emerald` is still the only ground.** This pass adds one subordinate layer whose single job is to *say which of the six departments you are looking at*, plus one missing semantic role.

| Token group | Value basis | Role — and only this role |
|---|---|---|
| `--dept-{slug}` ×6 | OKLCH `L 0.942 · C 0.034`, six hues 116°–352° | department fill: the 76px home category disc, the mobile-nav row, the category-page H1 chip, the active sub-filter row. Chroma history: seeded ~0.034 → raised to 0.065 in the colorize/critique pass to make the six hues separate at disc size → **pulled back to 0.034 in the quieter pass (§10)**. The louder version read as "a colourful storefront"; at 0.034 the disc is a faint wash and the department identity is carried by the owner's icon and the `-deep` accents, with hue as a soft legend cue only. |
| `--dept-{slug}-deep` ×6 | same hue, `L ~0.44 · C ~0.09` | department ink: the category-page breadcrumb's current segment, the PDP breadcrumb's category link, the mega-menu's «همه کالاهای این دسته» chip, the active sub-filter label, the H1-chip ring. All six clear **4.5:1 on `--page` and `--surface`** and on the brighter tint (measured ≥6:1). |
| `--info` / `--info-bg` / `--info-border` | `#2C556C` clinical blue, 6.6:1 on `--page` | **informational, not caution.** Features that are not live yet: the finder's "text search isn't on" note, the PDP «مقایسه/ذخیره — به‌زودی» chips. Distinct from `--warn` (ochre = be careful) and `--danger` (red = something is wrong). |
| `--emerald-hi` | `#234A38`, one L-step above `--emerald` | top sheen only. The header, trust band and footer carry a 4–6% vertical gradient (`--emerald-hi → --emerald`/`--emerald-deep`) so the emerald ground has material depth instead of reading as a flat block. `--bone` on it is still 8.2:1. |
| `--emerald-live-deep` | `#0C7350` | the **text-bearing** green. `--emerald-live` (`#1C8A69`) is graphical only — focus ring, dots, hero rule; light text on it was 3.97:1. Any green fill that carries `--surface`/`--bone` text — the "موجود" in-stock badge, the WhatsApp button — uses `--emerald-live-deep` instead (`--surface` on it = 5.4:1). |

Rules that keep this from becoming "a colourful storefront":

1. **A department hue never appears without its category icon or its text label.** Colour is always the third cue. The six icons are the owner's own artwork (`assets/categories/<slug>.webp` — their original dark-green line art with the white background removed, trimmed square, ~6–7 KB each). They are shown **as-is, never recoloured** — `cat-glyph.js` `catIcon()` just renders an `<img>`. They sit on the pale `--dept-*` tint disc; since the quieter pass (§10) that tint is a faint wash, so the icon carries the wayfinding and the hue only backs it up. The geometric `GLYPH` map is kept as the fallback for an unmapped slug and for the emerald nav bar, where a dark icon on a dark ground would not read.
2. **One department colour is visible at a time** on category and product pages. The home category rail is the only place all six appear together, and there it reads as a (quiet) legend.
3. **No colour on the shopping surface itself.** Product cards, prices, ratings, "add to cart", discount/low-stock badges are exactly as §2 defines them. The in-stock «موجود» pill was dropped from cards entirely in the distill pass (§10) — in-stock is now the unmarked default and only the exception «ناموجود» carries a badge on the grid. The spectrum lives in navigation and page headers, not in the grid.
4. **`oklch()` and `color-mix()` are used directly** (no hex fallback) — the build already ships `text-wrap: pretty`, which post-dates both.

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

## 5. Motion — re-choreographed 2026-09

> Supersedes the original "spent in one place" budget. The owner asked for a full
> motion pass (`impeccable animate + delight`); the storefront now has a complete
> motion language rather than one hero effect. What did **not** change: motion is
> still never triggered by scroll position — no reveals, no parallax, no
> `IntersectionObserver` — and it never delays the task.

**Thesis:** a precision instrument settling into place — weighted, damped,
certain. Exponential ease-out (`--ease-out` = `cubic-bezier(0.16,1,0.3,1)`) from
an already-visible rest state; never bounce or elastic. Four durations only
(`--dur-1..4` = 120 / 200 / 320 / 560 ms), one sibling delay (`--stagger` 60 ms,
capped at four steps).

**The authored moment — the hero.** The incoming slide *focuses in*: `scale(1.045
→ 1)` + opacity over 560 ms (transform/opacity only, no `will-change` on the
full-bleed layer). Its text column re-keys and the four children settle line by
line (translateY 10 px + opacity, 60 ms apart). The pagination is a row of
fixed-width tracks; the active one's fill sweeps from the start edge across the
6.5 s autoplay cycle — a visible cycle timer — and pauses while the hero is
hovered or focused. Autoplay unchanged: 6.5 s, pause on hover, silent under
`prefers-reduced-motion` (where the active track just shows filled).

**Continuity.** Every navigation crossfades the page (opacity, 320 ms) through a
wrapper keyed by *screen identity* — category / sub / product / account-tab — so
changing a filter or a page number inside a screen does **not** re-trigger it.
Lists settle in once, the moment their data lands: home carousels, the category
grid, cart lines, mega-menu columns. This is driven by the reconciler
re-creating those children on first paint, not by anything watching the
viewport.

**Feedback.** The tactile floor: every real control answers a press with a 60 ms
`translateY(1px) scale(0.985)`. Adding to cart confirms in three places at once —
the card / PDP button flips to an emerald **«به سبد اضافه شد»** state with a
drawn check and reverts after 1.6 s; the header cart badge re-keys, ticks up in
scale, and emits one ring pulse; the toast rises. `aria-live` notes (stock
clamps, the category result count, auth errors, the login contact→code step)
settle in on change instead of blinking.

**Waiting.** Skeletons carry a shimmer sweep instead of sitting as dead grey; the
boot screen is a real indeterminate bar. Both stop completely under reduced
motion.

**Delight.** Empty and terminal panels — empty cart, no orders, filters with no
match, «نظرات به‌زودی» — carry a faint embossed cross in the corner: the brand
mark as a letterhead watermark, tinted to the department hue on category pages.
It suits a shop whose promise is فاکتور رسمی. The WhatsApp button scales in once
after the page settles and lifts on hover.

**Material.** Transform and opacity carry most of it. The mega-menu and cart
dropdown additionally clear a 4 px blur as they land — small area, user-triggered,
affordable. The cart dropdown and mobile nav are now always mounted and shown via
`[data-open]` so they have a real exit as well as an entrance, and `inert` when
closed.

**Reduced motion.** Not "none". Spatial movement and the working loops are
removed; every entrance collapses to a 140 ms opacity fade so a state change
still confirms itself. `prefers-reduced-motion` is read into state at boot and
kept in sync, so JS-side decisions (the hero cycle timer) also respect it.

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
3. **Motion was everywhere.** The generic scroll-reveal, parallax and per-card hover-lift stay removed — motion is never triggered by scroll position. The 2026-09 re-choreograph (§5) then built a full, deliberate motion language on top of the hero: route crossfades, once-only list settles on data arrival, a tactile press floor, three-place add-to-cart feedback, shimmer waits, and a letterhead watermark on empty states. Ambition without scroll gimmicks.
4. **CTA was "the green button".** Revised to ink, which also freed emerald to do the ground work the brief demands — the generic version wasted the palette on a button.
5. **The hero was an overlay-on-photo.** Revised to a two-column split, because the API gives `title` + `highlight` + `cta_label` as *text* and no image URL: real Persian sentences at 19px are unreadable over a photograph, and the frontend owns the imagery anyway.
6. **What survived unchanged, deliberately:** the §2 section inventory, scroll-snap carousels, breadcrumbs, three-tab PDP, sticky cart summary. These are conventions users already know; spending novelty there would cost comprehension for nothing.

Where the brief pinned an axis — emerald/almond, RTL, vanilla JS, speed, 17 products, the §2 inventory — it was followed exactly. Where it left one free (card treatments, motion budget, the finder's copy, the safety-spec block, the terminal cart state) the freedom was spent on something specific to clinical purchasing rather than on a default.

## 9. Prototype scope vs. the shipping build

This Design Component is the **visual and interaction specification**: every §2 section, all three async states, real clamp behaviour, the 120-second resend countdown, all keyboard/`aria` structure, and the honest terminal state. Data is a fixture shaped exactly like the API contract in §4 (snake_case, `description` as a paragraph array, `specs` flat with `group`, cart lines keyed by `product_id`, `unit_price` with no snapshot and no totals) so the vanilla-JS port replaces the fixture with `api/client.js` and changes nothing else structurally.

Not yet in the prototype, and required for the shipping build: the real `fa.js` extraction (strings are currently module constants in the same file), the subsetted self-hosted Vazirmatn WOFF2, `srcset`/`sizes` on every image, `sessionStorage` list caching with TTL, `AbortController` on filter changes, the mobile filter bottom sheet, the add-address form, JSON-LD, `sitemap.xml`/`robots.txt`, and the measured Lighthouse run. Images here are the owner-supplied photographs at their native size — the shipping build must resize them per breakpoint, and the backend must gain cache headers (see BACKEND-GAPS.md).

## 10. Distill + quieter + polish pass (2026-09)

A finishing pass after the first design review scored the build "Acceptable" (26/40) and its own *Questions to Consider* asked which of the mega-menu, the faceted rail, pagination and the four-option sort actually earn their complexity at n=17. Product truth, content, RTL, the six-token palette and the ink CTA are all unchanged; what changed is weight, not identity.

**Distilled**

- **Mega-menu → a link row.** The full-width panel with three forced columns (one link each), a repeated hidden «زیردسته‌ها» heading and a 300px promo card is replaced by one `flex`, `wrap` row: «همه کالاهای این دسته» plus the department's handful of sub-categories as chips. It drops ~56px under the nav instead of ~320px of mostly-empty surface, and it stops contradicting §6.1 ("nothing pretends to be a marketplace"). `catBlurb` in `fa.js` is now unreferenced, kept for a future header use.
- **Finder — kept at three controls.** The distill pass first cut «چیدمان» from the finder (category + price only), on the reasoning that the results page owns sorting; the owner asked for it back — pre-sorting the shelf you land on is genuinely useful — so category + price + sort + «نمایش محصولات» stands, restyled to the same `selectStyle` as the other two.
- **`SORTERS.newest` made real.** The fixture had `newest: () => 0` (identity) while the home جدیدترین carousel used `getNewest()` (reversed) — «جدیدترین» meant two different orders. `newest` now mirrors `getNewest` (last-seeded first) so the two agree. The live API's `sort=newest` is untouched.
- **PDP thumbnail strip only for a real gallery.** One image padded out to four identical clones read as a rendering bug; a single-image product now just shows the one image.
- **In-stock «موجود» pill removed from cards** (see §2·b rule 3). **Rating `(۳۸)` count removed** from cards, and the PDP key-specs line changed from «۴٫۶ از ۳۸ نظر» to «امتیاز کارشناسی ۴٫۶ از ۵» — there is no review system (BACKEND-GAPS #4) and the parenthetical implied one.

**Quieter**

- **Department tint chroma `0.065 → 0.034`** (§2·b). The colorize pass had pushed it up to make the six discs separate; that read as "a colourful storefront". At 0.034 the disc is a faint wash and the icon carries the wayfinding.
- **Hero calmed.** Fixed `height: 600` (≈74% of a phone) → `min-height: clamp(468px, 58vh, 552px)` that grows to fit the copy instead of clipping it; incoming-slide scale `1.045 → 1.02`; the darkening gradient's peak `0.9 → 0.82` with a gentler falloff (bone text still clears 4.5:1); the «۱ از ۳ — kicker» line loses the kicker append (the CTA and highlight already name the department); `backdrop-filter: blur` dropped from the arrows and the ghost CTA. Pagination + arrows are `position: absolute`, pinned to the section's own bottom edge and aligned to the content start edge, so they hold one fixed spot across slides regardless of how tall each slide's headline + highlight run; the content column carries a matching `padding-block-end` so a tall slide on a phone never runs under them.
- **Motion diet** (supersedes parts of §5's inventory). Removed: the cart-badge expanding-ring pulse (`kmRing` — the tick alone confirms), the product-card image zoom-on-hover (the border-darken is the affordance), the category-disc hover lift, the 4px blur-clear on the mega/cart panels (`kmPanel`), the FAB's scale-from-half entrance and hover lift (now a plain fade + a deeper-shadow hover). Kept: the authored hero moment (settle + cycle-timer fill), route crossfade, once-only list settle, the tactile press floor, the in-place add-to-cart confirmation, shimmer waits, the letterhead watermark. The PDP image hover-zoom stays as a real inspection affordance but calmer (`1.1 → 1.04`).

**Polished**

- **Secondary-text contrast floor.** Sub-`0.68` ink/bone alphas on light and emerald grounds were raised toward `0.68–0.72` (breadcrumb-adjacent counts, result count, brand labels, rating text, featured note, PDP spec keys, tab labels, SKU line) so small secondary text clears AA.
- **Card CTA fit.** «افزودن به سبد خرید» overflowed the 246px carousel card by ~28px; the card label is now «افزودن به سبد» (the PDP keeps the full «افزودن به سبد خرید»).

**Deliberately left for a `shape` pass, not this one:** the capital-purchase path (an 89M-toman autoclave adds with one identical tap and no pre-invoice / installation / اقساط surfacing on its PDP), and the WhatsApp FAB overlapping tappable content on mobile.
