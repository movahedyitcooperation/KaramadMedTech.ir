"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";

/**
 * The finder card that floats off the hero — one of only two places in the
 * whole design that uses a shadow.
 *
 * This is NOT a search box, and says so in a line beneath itself: the backend
 * has no `q` param and no full-text index, so a text field here would promise
 * something that cannot work. Instead it composes the three filters the API
 * *does* support (category, price range, sort) and hands off to the normal
 * category listing, which is the same screen a shopper would otherwise reach
 * through the nav.
 *
 * All three controls are wanted, including چیدمان: pre-sorting the shelf
 * you're about to land on is genuinely useful even though the category page
 * has its own sort — don't "simplify" it away.
 */
export function HomeFinder({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [categorySlug, setCategorySlug] = useState("");
  const [band, setBand] = useState("");
  const [sort, setSort] = useState("newest");

  function submit() {
    const target = categorySlug || categories[0]?.slug;
    if (!target) return;
    const params = new URLSearchParams();
    // Band values are "min-max" with 0 meaning "unbounded on that side".
    const [min, max] = band ? band.split("-") : ["", ""];
    if (min && min !== "0") params.set("priceMin", min);
    if (max && max !== "0") params.set("priceMax", max);
    if (sort !== "newest") params.set("sort", sort);
    const qs = params.toString();
    router.push(`/category/${target}${qs ? `?${qs}` : ""}`);
  }

  const selectClass =
    "rounded-4 border border-ink/18 bg-white px-3.5 py-3 text-15 text-ink transition-colors duration-(--duration-state) focus-visible:border-emerald-live";
  const labelClass = "flex flex-col gap-2 text-13 text-ink/60";

  return (
    <section
      aria-label={fa.finder.aria}
      id="finder"
      className="relative z-10 mx-auto -mt-14 w-full max-w-[1280px] px-5 lg:px-8"
    >
      <div className="grid items-end gap-3.5 rounded-6 border border-ink/10 bg-surface p-[22px] shadow-float sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className={labelClass}>
          {fa.finder.category}
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className={selectClass}
          >
            <option value="">{fa.finder.allCategories}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          {fa.finder.price}
          <select value={band} onChange={(e) => setBand(e.target.value)} className={selectClass}>
            {fa.finder.bands.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          {fa.finder.sort}
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
            {fa.finder.sorts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <Button type="button" onClick={submit} className="h-12 rounded-4 px-7 text-[15.5px] font-bold">
          {fa.finder.submit}
        </Button>
      </div>

      <p className="mt-2.5 flex items-baseline gap-2 px-0.5 text-[13px] leading-relaxed text-info">
        <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-info" />
        <span>{fa.finder.note}</span>
      </p>
    </section>
  );
}
