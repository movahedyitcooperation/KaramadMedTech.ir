"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { parseFaDigits, toPersianDigits, toPersianNumber } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { useFiltersSheet } from "@/components/shop/FiltersSheetContext";
import { PriceRangeSlider } from "@/components/shop/PriceRangeSlider";
import { resolveDepartment } from "@/lib/utils/department";
import { cn } from "@/lib/utils/cn";

export interface ScopeLink {
  /** Href to navigate to when this scope is chosen. */
  href: string;
  name: string;
  count: number;
  /** Marks the entry as currently selected. */
  active: boolean;
}

interface CategoryFiltersPanelProps {
  /** Heading above the scope list: «زیردسته‌ها» on a department listing,
   * «دسته‌بندی‌ها» on the search page. */
  scopeHeading: string;
  /** Sub-categories of a department, or the departments themselves on the
   * search page — the panel does not care which, it just links them. */
  scopeLinks: ScopeLink[];
  /** Department whose tint marks the selected scope row. Null on the search
   * page, where results span every department and no single hue applies. */
  departmentSlug: string | null;
  brands: { name: string; count: number }[];
  /** Price span for the current query with the price filter itself removed,
   * so the slider's ends stay put while its handles move. Null falls the
   * price filter back to a plain min/max pair. */
  priceBounds: { min: number; max: number } | null;
  total: number;
}

/**
 * The category sidebar. All filter state lives in the URL, so a filtered
 * listing is a shareable, bookmarkable, back-button-correct address and the
 * server does the filtering — there is no client-side result list to keep in
 * sync with it.
 *
 * Below the nav breakpoint this same element becomes a bottom sheet
 * (`.km-filters` in globals.css) rather than a second, separately-built
 * mobile filter UI.
 */
export function CategoryFiltersPanel({
  scopeHeading,
  scopeLinks,
  departmentSlug,
  brands,
  priceBounds,
  total,
}: CategoryFiltersPanelProps) {
  const { open, setOpen } = useFiltersSheet();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const department = departmentSlug ? resolveDepartment(departmentSlug) : null;

  // Uncontrolled and keyed on the URL value: the visitor types freely, and a
  // change from outside (filters cleared, back button) re-mounts the input
  // with the new value rather than an effect writing over their keystrokes.
  // The keys are prefixed because both values are "" when no price filter is
  // set, and two siblings keyed "" is a duplicate-key collision.
  const priceMin = searchParams.get("priceMin") ?? "";
  const priceMax = searchParams.get("priceMax") ?? "";

  const selectedBrands = searchParams.getAll("brand");
  const inStockOnly = searchParams.get("inStockOnly") === "1";

  /** Every filter change resets to page 1 — page 3 of the previous result
   * set is meaningless once the set itself changes. */
  function apply(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    mutate(params);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function commitPrice(key: "priceMin" | "priceMax", raw: string) {
    const digits = parseFaDigits(raw);
    apply((p) => {
      if (digits) p.set(key, digits);
      else p.delete(key);
    });
  }

  /** Both handles land in one navigation — the slider reports each end as a
   * number, or null when it is resting on the track end and no bound applies. */
  function commitPriceRange(nextMin: number | null, nextMax: number | null) {
    apply((p) => {
      if (nextMin != null) p.set("priceMin", String(nextMin));
      else p.delete("priceMin");
      if (nextMax != null) p.set("priceMax", String(nextMax));
      else p.delete("priceMax");
    });
  }

  const priceValueMin = priceMin ? Number(priceMin) : null;
  const priceValueMax = priceMax ? Number(priceMax) : null;
  const hasPriceRange = priceBounds != null && priceBounds.max > priceBounds.min;

  const inputClass =
    "min-w-0 flex-1 rounded-3 border border-ink/18 bg-white px-3 py-2.5 text-sm text-ink";

  return (
    <aside
      data-open={String(open)}
      aria-label={fa.category.filtersHeading}
      className="km-filters flex flex-col gap-6 rounded-6 border border-ink/9 bg-surface p-[22px]"
    >
      <div className="sticky -top-[22px] z-1 -mb-2 flex items-center justify-between gap-3 border-b border-ink/10 bg-surface pt-1.5 pb-3 lg:hidden">
        <strong className="text-[17px] font-bold">{fa.category.filtersHeading}</strong>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={fa.category.closeFilters}
          className="size-9.5 cursor-pointer rounded-4 border border-ink/16 text-lg text-ink"
        >
          ×
        </button>
      </div>

      <div>
        <div className="mb-3 text-14 font-bold">{scopeHeading}</div>
        <div className="flex flex-col gap-px">
          {scopeLinks.map((scope) => (
            <Link
              key={scope.href}
              href={scope.href}
              className={cn(
                "flex justify-between gap-2.5 rounded-3 px-3 py-2 text-start text-sm",
                scope.active ? "font-semibold" : "font-normal text-ink/75"
              )}
              style={
                scope.active
                  ? {
                      background: department?.tint ?? "var(--color-page)",
                      color: department?.deep ?? "var(--color-ink)",
                    }
                  : undefined
              }
            >
              <span>{scope.name}</span>
              <span className={cn("text-12", !scope.active && "text-ink/60")}>
                {toPersianNumber(scope.count)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-ink/10 pt-[22px]">
        <div className="mb-3 text-14 font-bold">{fa.category.priceHeading}</div>
        {hasPriceRange ? (
          <PriceRangeSlider
            key={`${priceMin}|${priceMax}|${priceBounds.min}|${priceBounds.max}`}
            boundMin={priceBounds.min}
            boundMax={priceBounds.max}
            valueMin={priceValueMin}
            valueMax={priceValueMax}
            onCommit={commitPriceRange}
          />
        ) : (
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              inputMode="numeric"
              aria-label={fa.category.priceMinAria}
              placeholder={fa.category.from}
              key={`min-${priceMin}`}
              defaultValue={priceMin ? toPersianDigits(priceMin) : ""}
              onBlur={(e) => commitPrice("priceMin", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPrice("priceMin", e.currentTarget.value);
              }}
              className={inputClass}
            />
            <span className="text-ink/35">—</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label={fa.category.priceMaxAria}
              placeholder={fa.category.to}
              key={`max-${priceMax}`}
              defaultValue={priceMax ? toPersianDigits(priceMax) : ""}
              onBlur={(e) => commitPrice("priceMax", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPrice("priceMax", e.currentTarget.value);
              }}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {brands.length > 0 && (
        <div className="border-t border-ink/10 pt-[22px]">
          <div className="mb-1 text-14 font-bold">{fa.category.brandHeading}</div>
          {/* Labelled as "brands present in this category's results" because
           * there is no brands endpoint — the facet is derived, not
           * exhaustive, and should not pretend otherwise. */}
          <p className="mb-3 text-12 leading-[1.7] text-ink/68">{fa.category.brandNote}</p>
          <div className="flex flex-col gap-2">
            {brands.map((brand) => (
              <label key={brand.name} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.name)}
                  onChange={() =>
                    apply((p) => {
                      const next = selectedBrands.includes(brand.name)
                        ? selectedBrands.filter((b) => b !== brand.name)
                        : [...selectedBrands, brand.name];
                      p.delete("brand");
                      next.forEach((b) => p.append("brand", b));
                    })
                  }
                  className="size-4 accent-emerald"
                />
                <span dir="ltr" className="flex-1 text-start">
                  {brand.name}
                </span>
                <span className="text-12 text-ink/60">{toPersianNumber(brand.count)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3.5 border-t border-ink/10 pt-[22px]">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() =>
              apply((p) => {
                if (inStockOnly) p.delete("inStockOnly");
                else p.set("inStockOnly", "1");
              })
            }
            className="size-4 accent-emerald"
          />
          <span>{fa.category.inStockOnly}</span>
        </label>
        <button
          type="button"
          onClick={() =>
            apply((p) => {
              // Sort is a view preference, not a filter, and `q` IS the
              // search — clearing filters must not silently re-order the
              // shelf or throw away what the shopper searched for.
              const kept = { sort: p.get("sort"), q: p.get("q") };
              for (const key of [...p.keys()]) p.delete(key);
              if (kept.sort) p.set("sort", kept.sort);
              if (kept.q) p.set("q", kept.q);
            })
          }
          className="cursor-pointer rounded-4 border border-ink/18 p-2.5 text-sm text-ink transition-colors duration-(--duration-state) hover:border-ink"
        >
          {fa.category.clear}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer rounded-4 bg-ink p-3.5 text-15 font-bold text-surface lg:hidden"
        >
          {fa.category.applyMobile(total)}
        </button>
      </div>
    </aside>
  );
}
