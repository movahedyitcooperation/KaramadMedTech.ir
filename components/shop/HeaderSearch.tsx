"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchGlyph } from "@/components/ui/SearchGlyph";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils/cn";

/**
 * The search field in the header — the same slot the ported design gave its
 * product-finding control, between the brand lockup and the account/cart
 * cluster, because that is where a shopper looks for it.
 *
 * A submit-and-navigate form, not a live-filtering input: submitting goes to
 * /search?q=…, so results are a real server-rendered page with a shareable
 * URL, a working back button, and the same filter/sort/pagination machinery
 * as a category listing. Matching happens in Postgres — nothing is filtered
 * in the browser.
 *
 * Uncontrolled, keyed on the active query: the shopper types freely, and a
 * change from outside (a new search, the back button) re-mounts the input
 * with the new value. That avoids an effect writing over their keystrokes.
 */
export function HeaderSearch({
  className,
  tone = "emerald",
  autoFocus = false,
}: {
  className?: string;
  /** "emerald" for the header band, "surface" for a light page ground — the
   * same control, since a shopper who reaches /search on a phone (where the
   * header shows only an icon) needs somewhere to actually type. */
  tone?: "emerald" | "surface";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const activeQuery = useSearchParams().get("q") ?? "";
  const onEmerald = tone === "emerald";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = new FormData(event.currentTarget).get("q");
    const query = typeof raw === "string" ? raw.trim() : "";
    // An empty submit is a no-op rather than a trip to an empty results page:
    // the shopper almost certainly hit Enter by accident.
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn(
        // The focused field announces itself by firming up this border,
        // instead of the site-wide emerald focus ring — that ring's green
        // glow was too loud on a control you are only ever typing into.
        // `km-search` is what lets the magnifying glass sweep on hover and
        // on focus-within — the reach, not the typing (app/globals.css).
        "km-search flex items-center gap-2.5 rounded-pill ps-4 pe-1.5 transition-colors duration-(--duration-state)",
        onEmerald
          ? "j-hdr-finder focus-within:border-bone/50"
          : "border border-ink/18 bg-white focus-within:border-ink/45",
        className
      )}
    >
      <SearchGlyph className={onEmerald ? undefined : "text-ink/55"} />
      <input
        key={activeQuery}
        type="search"
        name="q"
        defaultValue={activeQuery}
        placeholder={fa.header.searchPlaceholder}
        aria-label={fa.header.searchLabel}
        autoFocus={autoFocus}
        className={cn(
          // focus:outline-none alone leaves the global :focus-visible rule's
          // green box-shadow behind; both have to go.
          "min-w-0 flex-1 bg-transparent py-3 text-start text-15 focus-visible:shadow-none focus-visible:outline-none",
          onEmerald ? "text-bone placeholder:text-bone/60" : "text-ink placeholder:text-ink/65"
        )}
      />
      <button
        type="submit"
        className={cn(
          "shrink-0 cursor-pointer rounded-pill px-4 py-2 text-13 font-bold transition-colors duration-(--duration-state)",
          onEmerald ? "bg-bone/90 text-ink hover:bg-bone" : "bg-ink text-surface hover:bg-emerald"
        )}
      >
        {fa.header.searchSubmit}
      </button>
    </form>
  );
}
