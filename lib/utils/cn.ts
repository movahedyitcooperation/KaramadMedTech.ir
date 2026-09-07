import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The theme's own font-size names, mirroring the `--text-*` tokens in the
 * `@theme` block of app/globals.css.
 *
 * tailwind-merge only recognises Tailwind's default t-shirt sizes (`sm`,
 * `lg`, `2xl`, …). Every other `text-*` class falls through to its catch-all
 * text-COLOUR group — so it read `text-14` as a colour, decided it conflicted
 * with `text-surface`, and silently dropped whichever came first. Both
 * directions of that were live bugs:
 *
 *   - the colour lost: the add-to-cart CTA rendered `bg-ink` with no colour
 *     class, inheriting ink from `body` — ink text on an ink fill, 1:1;
 *   - the size lost: RatingRow, the logo tagline, the header search input,
 *     Pagination, OrderStatusBadge and the out-of-stock link fell back to the
 *     16px body default instead of their 13.5 / 12.5 / 15px tokens.
 *
 * Registering the names as font-sizes fixes both at once, for every component
 * that routes classes through `cn()`. Keep this list in step with globals.css
 * — cn.test.ts fails if the two drift apart.
 */
export const themeFontSizes = [
  "display",
  "h1",
  "h1-flat",
  "h2",
  "h3",
  "lead",
  "lg",
  "15",
  "14",
  "13",
  "12",
  "11",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...themeFontSizes] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
