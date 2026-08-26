import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { DirIcon } from "@/components/ui/DirIcon";
import { fa } from "@/lib/i18n/fa";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const all: BreadcrumbItem[] = [{ label: fa.common.home, href: "/" }, ...items];

  return (
    <nav aria-label="مسیر صفحه" className="mb-4 flex flex-wrap items-center gap-1 text-sm">
      {all.map((item, i) => {
        const isLast = i === all.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <DirIcon icon={CaretLeft} size={14} className="text-ink-500" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="text-ink-500 hover:text-brand-600">
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className="text-ink-900">
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
