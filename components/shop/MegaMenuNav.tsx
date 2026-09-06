"use client";

import Link from "next/link";
import { useState } from "react";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";
import { resolveDepartment } from "@/lib/utils/department";
import { cn } from "@/lib/utils/cn";

interface CategoryWithChildren extends Category {
  children: Category[];
}

/**
 * Department glyph for the nav strip.
 *
 * The nav sits on --emerald-deep, where the owner's dark-green category icon
 * would not read at all, so this is the one place a department is marked by a
 * geometric bone shape instead of its icon. The shape differs per department
 * and always sits beside the department's name, so the "never color alone"
 * rule still holds — there is simply no color here to begin with.
 */
const GLYPH_SHAPE: Record<string, string> = {
  diagnostics: "rounded-full",
  consumables: "rounded-[3px]",
  rehab: "rounded-[4px]",
  homecare: "rounded-[12px]",
  clinic: "rounded-[2px]",
  accessories: "rounded-[6px]",
};

/**
 * The nav strip plus its one-row department panel.
 *
 * A 15-product catalog with a two-level tree does not need a marketplace
 * mega-menu: the panel is one tidy row — "all of this department" plus its
 * handful of sub-categories — dropping ~56px under the nav rather than ~320px
 * of mostly-empty surface.
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
                "flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-bone transition-colors duration-(--duration-state)",
                openSlug === cat.slug ? "bg-bone/14" : "bg-transparent"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block size-[13px] shrink-0 border-[1.5px] border-bone/60",
                  GLYPH_SHAPE[dept?.key ?? ""] ?? "rounded-[4px]"
                )}
              />
              <span>{cat.name}</span>
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
