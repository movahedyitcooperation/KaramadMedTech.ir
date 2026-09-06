"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { fa } from "@/lib/i18n/fa";

/**
 * The چیدمان control. Writes `sort` into the URL (and drops `page`, since
 * page 3 of a differently-ordered shelf is meaningless) and lets the server
 * re-query — the backend orders in SQL, so this never re-sorts a list in the
 * browser.
 *
 * "newest" is the backend's own default, so it is represented by the
 * *absence* of the param rather than `?sort=newest` — the default listing
 * keeps a clean URL.
 */
export function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "newest";

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  return (
    <label className="flex items-center gap-2.5 text-sm text-ink/70">
      {fa.category.sort}
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="rounded-4 border border-ink/18 bg-surface px-3.5 py-2.5 text-14 text-ink"
      >
        {fa.finder.sorts.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
