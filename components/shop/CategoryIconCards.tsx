import { Package } from "@phosphor-icons/react/dist/ssr";
import * as PhosphorIcons from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react/lib";
import Link from "next/link";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";

function resolveIcon(name: string): Icon {
  const icons = PhosphorIcons as unknown as Record<string, Icon>;
  return icons[name] ?? Package;
}

export function CategoryIconCards({ categories }: { categories: Category[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink-900">
        <span className="h-4 w-1 rounded-full bg-coral-500" aria-hidden="true" />
        {fa.home.specialOffersTitle}
      </h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
        {categories.map((cat) => {
          const Icon = resolveIcon(cat.icon);
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-card p-3 text-center transition-colors duration-200 hover:bg-brand-50 sm:w-auto"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon size={26} aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-ink-900">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
