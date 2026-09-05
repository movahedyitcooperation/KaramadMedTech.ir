import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";

interface CategoryWithChildren extends Category {
  children: Category[];
}

/**
 * The design's own final "quieter pass" collapsed this from a big
 * hover-flyout panel (~320px drop) to a single flex-wrap link row
 * (~56px) — no dropdown, no children reveal, just the six top-level
 * categories. That simplification also means this no longer needs any
 * client-side state (hover/focus/Escape handling) and can be a plain
 * Server Component again.
 */
export function MegaMenuNav({ categories }: { categories: CategoryWithChildren[] }) {
  return (
    <nav aria-label={fa.megaMenu.allCategories} className="flex flex-wrap items-center gap-1 py-1">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="rounded-3 px-3.5 py-2.5 text-sm font-medium text-bone/85 transition-colors duration-(--duration-state) hover:bg-bone/10 hover:text-bone"
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
