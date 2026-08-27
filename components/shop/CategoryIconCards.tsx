import { Package } from "@phosphor-icons/react/dist/ssr";
import * as PhosphorIcons from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react/lib";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";

function resolveIcon(name: string): Icon {
  const icons = PhosphorIcons as unknown as Record<string, Icon>;
  return icons[name] ?? Package;
}

export function CategoryIconCards({ categories }: { categories: Category[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <SectionHeader kicker={fa.home.categoriesKicker} title={fa.home.categoriesTitle} />
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
        {categories.map((cat) => {
          const Icon = resolveIcon(cat.icon);
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex w-28 shrink-0 flex-col items-center gap-2.5 rounded-card border border-line bg-surface p-4 text-center shadow-xs transition-[box-shadow,border-color,transform] duration-(--duration-base) ease-out-soft hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm sm:w-auto"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon size={26} aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-ink-700">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
