import Image from "next/image";
import Link from "next/link";
import { CategoryRailChips } from "@/components/shop/CategoryRailChips";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";
import { resolveDepartment } from "@/lib/utils/department";

/** The carousel track's id — the chip strip locates it with this. */
const TRACK_ID = "km-category-rail";

export interface CategoryRailItem {
  category: Category;
  /** Still supplied by the home page, no longer shown. Kept on the item so
   * the count is one prop away if it is ever wanted back. */
  productCount: number;
}

/**
 * The home category rail — the owner's six category photographs, in three
 * presentations that share one DOM, one set of images and one set of links.
 * Only one is ever live:
 *
 *   lg and up  the expandable row: every card is `flex: 1 1 0`, the card
 *              under the pointer animates `flex-grow` to 2.6 against its
 *              neighbours' 0.78 (~40% of the row) and only then reveals its
 *              name and blurb over the photograph. The reveal IS the
 *              interaction — do not surface the card title at rest here.
 *   sm .. lg   a two-up grid with that overlay pinned open.
 *   under sm   a scroll-snap carousel driven by a strip of pill chips: the
 *              card carries a small number+name badge, the blurb sits in a
 *              caption UNDER the picture rather than over it, and the
 *              neighbouring cards peek past the screen edge — which is where
 *              the depth comes from, so no stacked ghost card is needed and
 *              nothing has to fake a shadow (this design rations shadows to
 *              two places — CLAUDE.md §3).
 *
 * The phone and desktop treatments are mutually exclusive `display:none`, so
 * the duplicated name/blurb never reaches the accessibility tree twice and
 * the two animation systems can never both run.
 *
 * Every card is a plain `<Link>` to `/category/<slug>`, unchanged: one tap
 * navigates, and the labels and routing come from the same `items` the rail
 * has always been handed.
 */
export function CategoryIconCards({ items }: { items: CategoryRailItem[] }) {
  return (
    <section
      aria-labelledby="km-category-rail-heading"
      className="mx-auto max-w-[1280px] px-5 pt-16 lg:px-8"
    >
      {/* Names the section in the document outline, which used to hold
       * three headings for the whole homepage. This heading is deliberately
       * the ONLY text the rail shows at rest — the cards themselves stay
       * bare photographs until hovered. */}
      <h2
        id="km-category-rail-heading"
        className="mb-6 text-h2 font-extrabold tracking-[-0.01em]"
      >
        {fa.home.categoriesAria}
      </h2>
      {/* Phone: a two-part composition — the vertical index on the physical
        * LEFT, the selected category on the right. `.km-cat-stage` is
        * `flex-direction: row-reverse` under sm precisely because the page is
        * RTL: in a plain RTL row the FIRST child lands on the right, and the
        * index has to be first in the DOM (it is read first, and it labels
        * what follows) while sitting physically left. At sm and up the stage
        * is `display: contents`, so it vanishes from layout entirely and the
        * tablet grid and desktop row are laid out exactly as before. */}
      <div className="km-cat-stage">
        <CategoryRailChips
          trackId={TRACK_ID}
          labels={items.map((i) => i.category.name)}
        />

        {/* All three layouts live on .km-cat-row in globals.css rather than in
          * utilities here, so the element switches mode in one place. */}
        <div id={TRACK_ID} className="km-cat-row">
        {items.map(({ category }) => {
          const department = resolveDepartment(category.slug);
          const blurb = department ? fa.home.categoryBlurb[department.key] : undefined;
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              /* on-emerald: the focus ring switches to bone, since the card
               * is a photograph rather than one of the light grounds. */
              className="km-cat-card on-emerald block h-full rounded-7"
            >
              <span
                /* The picture itself. bg-emerald is what shows before the
                 * photo decodes — and what an unrecognised slug with no
                 * photo keeps — so a card is never a white hole. */
                className="km-cat-frame relative block h-full overflow-hidden rounded-7 bg-emerald sm:aspect-[4/3] sm:h-auto lg:aspect-auto lg:h-full"
              >
                {department && (
                  <Image
                    src={department.photoSrc}
                    alt={category.name}
                    fill
                    sizes="(min-width: 1024px) 520px, (min-width: 640px) 50vw, 86vw"
                    className="km-cat-photo object-cover object-center"
                  />
                )}

                {/* The copy sits ON the picture at every width, over a scrim
                  * that is dark at the bottom and clear by two-thirds up.
                  * Pinned open below lg; hover-revealed at lg. */}
                <span className="km-cat-overlay absolute inset-0 flex flex-col justify-end p-4 lg:p-5">
                  <span className="km-cat-copy block w-full text-start lg:w-[360px] lg:max-w-full">
                    {/* Hidden on a phone: the vertical index beside the card
                      * already names the selected category, so repeating it
                      * on the picture says it twice. From sm up there is no
                      * index, so the title carries the card.
                      * aria-hidden throughout: the name is already the
                      * image's alt. */}
                    <span
                      aria-hidden="true"
                      className="hidden text-lg leading-tight font-bold text-bone sm:block"
                    >
                      {category.name}
                    </span>
                    {/* On a phone the blurb is clamped to three lines: the
                      * picture is the point of the card, and an unclamped
                      * two-sentence blurb was taking nearly half of it. The
                      * full text is still in the DOM for assistive tech, and
                      * from sm up — where the card is wider and the title sits
                      * above it — it runs in full. */}
                    {blurb && (
                      <span className="mt-2 line-clamp-3 text-12 leading-relaxed text-bone/82 sm:line-clamp-none sm:block sm:text-13">
                        {blurb}
                      </span>
                    )}
                  </span>
                </span>
              </span>
            </Link>
          );
        })}
        </div>
      </div>
    </section>
  );
}
