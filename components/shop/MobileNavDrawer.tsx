"use client";

import { CaretDown, List, X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { DirIcon } from "@/components/ui/DirIcon";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";
import type { ContactSetting } from "@/lib/types/settings";
import { cn } from "@/lib/utils/cn";

interface CategoryWithChildren extends Category {
  children: Category[];
}

export function MobileNavDrawer({
  categories,
  contact,
}: {
  categories: CategoryWithChildren[];
  contact: ContactSetting;
}) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={fa.header.openMenu}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink-900 hover:bg-bg lg:hidden"
      >
        <List size={22} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={fa.header.openMenu}
            className="absolute inset-y-0 start-0 flex w-[85vw] max-w-sm flex-col bg-surface shadow-soft-lg"
          >
            <div className="flex items-center justify-between border-b border-line p-4">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={fa.header.closeMenu}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-500 hover:bg-bg"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {categories.map((cat) => {
                  const expanded = expandedId === cat.id;
                  return (
                    <li key={cat.id}>
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/category/${cat.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex-1 rounded-input px-2 py-3 text-sm font-medium text-ink-900 hover:bg-bg"
                        >
                          {cat.name}
                        </Link>
                        {cat.children.length > 0 && (
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-label={cat.name}
                            onClick={() => setExpandedId(expanded ? null : cat.id)}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-500 hover:bg-bg"
                          >
                            <DirIcon
                              icon={CaretDown}
                              flip={false}
                              size={16}
                              className={cn(
                                "transition-transform duration-200",
                                expanded && "rotate-180"
                              )}
                            />
                          </button>
                        )}
                      </div>
                      {expanded && (
                        <ul className="ms-4 space-y-1 border-s border-line ps-3">
                          {cat.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/category/${child.slug}`}
                                onClick={() => setOpen(false)}
                                className="block rounded-input px-2 py-2 text-sm text-ink-500 hover:bg-bg hover:text-ink-900"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-line p-4 text-sm text-ink-500">
              <p>{toPersianDigits(contact.phone)}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
