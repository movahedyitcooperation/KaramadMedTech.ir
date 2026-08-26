"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";

interface CategoryWithChildren extends Category {
  children: Category[];
}

export function MegaMenuNav({ categories }: { categories: CategoryWithChildren[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenId(null);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  return (
    <nav ref={navRef} aria-label={fa.megaMenu.allCategories} className="flex items-center gap-1">
      {categories.map((cat) => {
        const open = openId === cat.id;
        return (
          <div
            key={cat.id}
            className="relative"
            onMouseEnter={() => setOpenId(cat.id)}
            onMouseLeave={() => setOpenId((id) => (id === cat.id ? null : id))}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOpenId((id) => (id === cat.id ? null : id));
              }
            }}
          >
            <Link
              href={`/category/${cat.slug}`}
              aria-expanded={cat.children.length > 0 ? open : undefined}
              aria-haspopup={cat.children.length > 0 ? "true" : undefined}
              onFocus={() => setOpenId(cat.id)}
              className="block whitespace-nowrap px-3 py-3 text-sm font-medium text-ink-900 transition-colors duration-200 hover:text-brand-600"
            >
              {cat.name}
            </Link>

            {cat.children.length > 0 && open && (
              <div className="absolute start-0 top-full z-50 w-64 rounded-card border border-line bg-surface p-4 shadow-soft-lg">
                <ul className="space-y-1">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/category/${child.slug}`}
                        className="block rounded-input px-2 py-1.5 text-sm text-ink-900 hover:bg-bg"
                        onClick={() => setOpenId(null)}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/category/${cat.slug}`}
                  className="mt-3 block border-t border-line pt-3 text-sm font-medium text-brand-600 hover:underline"
                  onClick={() => setOpenId(null)}
                >
                  {fa.megaMenu.viewAllIn(cat.name)}
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
