import { fa } from "@/lib/i18n/fa";

/**
 * First focusable element on every page.
 *
 * The header carries the brand, the search form, the phone widget, login,
 * cart and a six-department nav strip — 25-40 stops before the content
 * starts. Without this a keyboard user re-traverses all of it on every
 * navigation.
 *
 * Visually hidden until focused, then it lands as a real ink chip in the
 * page's inline-start corner rather than being revealed off-screen.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-200 focus:rounded-4 focus:bg-ink focus:px-5 focus:py-3 focus:text-15 focus:font-semibold focus:text-surface"
    >
      {fa.header.skipToContent}
    </a>
  );
}
