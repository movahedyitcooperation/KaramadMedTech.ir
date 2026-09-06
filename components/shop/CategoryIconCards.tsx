import Link from "next/link";
import { DepartmentMark } from "@/components/shop/DepartmentMark";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";
import { resolveDepartment } from "@/lib/utils/department";

export interface CategoryRailItem {
  category: Category;
  productCount: number;
}

/**
 * The home category rail — the ONLY place all six department colors appear
 * together, and they appear there as a legend: this is where a shopper learns
 * that cyan means تجهیزات تشخیصی. Every other surface shows at most one
 * department color, and the shopping surface itself shows none.
 */
export function CategoryIconCards({ items }: { items: CategoryRailItem[] }) {
  return (
    <section
      aria-label={fa.home.categoriesAria}
      className="mx-auto max-w-[1280px] px-5 pt-16 lg:px-8"
    >
      <div className="grid grid-cols-2 gap-4.5 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(({ category, productCount }) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="flex flex-col items-center rounded-4 px-2.5 py-4.5 transition-colors duration-(--duration-state) ease-out hover:bg-ink/[0.045]"
          >
            <DepartmentMark
              department={resolveDepartment(category.slug)}
              label={category.name}
              size={76}
              layout="stack"
              meta={fa.home.countUnit(productCount)}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
