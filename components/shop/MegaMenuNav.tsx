"use client";

import Link from "next/link";
import { useState } from "react";
import { DepartmentMark } from "@/components/shop/DepartmentMark";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";
import { resolveDepartment } from "@/lib/utils/department";
import { cn } from "@/lib/utils/cn";

interface CategoryWithChildren extends Category {
  children: Category[];
}

/**
 * The nav strip plus its one-row department panel.
 *
 * A 15-product catalog with a two-level tree does not need a marketplace
 * mega-menu: the panel is one tidy row — "all of this department" plus its
 * handful of sub-categories — dropping ~56px under the nav rather than ~320px
 * of mostly-empty surface.
 *
 * Each entry is marked by the owner's own department icon, the same artwork
 * the home rail uses. The nav sits on --emerald-deep, where that dark-green
 * line art would vanish, so it rides a light `tone="plain"` disc — the exact
 * framing the owner's reference icons have — rather than being recolored to
 * bone. No department hue appears here at all, which keeps the "never color
 * alone" rule trivially satisfied.
 */
export function MegaMenuNav({ categories }: { categories: CategoryWithChildren[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = categories.find((c) => c.slug === openSlug) ?? null;
  const department = open ? resolveDepartment(open.slug) : null;

  return (
    <nav
      aria-label={fa.nav.aria}
      className="relative"
      onMouseLeave={() => setOpenSlug(null)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpenSlug(null);
      }}
    >
      <div className="flex items-stretch gap-0.5">
        {categories.map((cat) => {
          const dept = resolveDepartment(cat.slug);
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              onMouseEnter={() => setOpenSlug(cat.slug)}
              onFocus={() => setOpenSlug(cat.slug)}
              aria-expanded={openSlug === cat.slug}
              className={cn(
                "flex items-center px-2.5 py-2.5 text-sm font-medium text-bone transition-colors duration-(--duration-state) xl:px-4",
                openSlug === cat.slug ? "bg-bone/14" : "bg-transparent"
              )}
            >
              <DepartmentMark
                department={dept}
                label={cat.name}
                size={28}
                tone="plain"
                className="gap-1.5 xl:gap-2.5"
              />
            </Link>
          );
        })}
      </div>

      {open && (
        <div className="km-panel absolute inset-x-0 top-full z-50 border-b border-ink/12 bg-surface shadow-float">
          <div className="km-stagger mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-8 py-3.5">
            <Link
              href={`/category/${open.slug}`}
              className="rounded-3 bg-page px-3.5 py-2 text-sm leading-normal font-bold transition-colors duration-(--duration-state)"
              style={{ color: department?.deep ?? "var(--color-emerald)" }}
            >
              {fa.nav.allOfCategory}
            </Link>
            {open.children.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}`}
                className="rounded-3 px-3.5 py-2 text-sm leading-normal text-ink/80 transition-colors duration-(--duration-state) hover:text-emerald-live"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
