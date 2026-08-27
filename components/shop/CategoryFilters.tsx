import Link from "next/link";
import { fa } from "@/lib/i18n/fa";

interface CategoryFiltersProps {
  subcategories: { slug: string; name: string }[];
  brands: string[];
  values: {
    priceMin?: string;
    priceMax?: string;
    brands: string[];
    inStockOnly: boolean;
  };
}

export function CategoryFilters({ subcategories, brands, values }: CategoryFiltersProps) {
  return (
    <form method="get" className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold text-ink-900">{fa.category.priceRangeTitle}</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            name="priceMin"
            aria-label={fa.category.priceMin}
            defaultValue={values.priceMin}
            placeholder={fa.category.priceMin}
            min={0}
            autoComplete="off"
            className="h-10 w-full rounded-input border border-line bg-surface px-3 text-sm text-ink-900"
          />
          <span className="text-ink-500" aria-hidden="true">
            —
          </span>
          <input
            type="number"
            inputMode="numeric"
            name="priceMax"
            aria-label={fa.category.priceMax}
            defaultValue={values.priceMax}
            placeholder={fa.category.priceMax}
            min={0}
            autoComplete="off"
            className="h-10 w-full rounded-input border border-line bg-surface px-3 text-sm text-ink-900"
          />
        </div>
      </div>

      {subcategories.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-ink-900">{fa.category.subcategoriesTitle}</h3>
          <ul className="space-y-2">
            {subcategories.map((s) => (
              <li key={s.slug}>
                <Link href={`/category/${s.slug}`} className="text-sm text-ink-500 hover:text-brand-600">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brands.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-ink-900">{fa.category.brandTitle}</h3>
          <ul className="space-y-2">
            {brands.map((brand) => (
              <li key={brand}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-900">
                  <input
                    type="checkbox"
                    name="brand"
                    value={brand}
                    defaultChecked={values.brands.includes(brand)}
                    className="h-4 w-4 rounded border-line accent-brand-600"
                  />
                  {brand}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-900">
        <input
          type="checkbox"
          name="inStockOnly"
          value="1"
          defaultChecked={values.inStockOnly}
          className="h-4 w-4 rounded border-line accent-brand-600"
        />
        {fa.category.inStockOnly}
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          className="h-10 flex-1 cursor-pointer rounded-pill bg-brand-600 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-700"
        >
          {fa.category.applyFilters}
        </button>
        <Link
          href="?"
          className="flex h-10 items-center justify-center rounded-pill border border-line px-4 text-sm text-ink-900 hover:bg-bg"
        >
          {fa.category.clearFilters}
        </Link>
      </div>
    </form>
  );
}
