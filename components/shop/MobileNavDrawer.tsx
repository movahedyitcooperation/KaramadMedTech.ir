"use client";

import { CaretDown, List, X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { DirIcon } from "@/components/ui/DirIcon";
import { useDisclosureAnimation } from "@/hooks/useDisclosureAnimation";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";
import type { ContactSetting } from "@/lib/types/settings";
import { cn } from "@/lib/utils/cn";

interface CategoryWithChildren extends Category {
  children: Category[];
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNavDrawer({
  categories,
  contact,
}: {
  categories: CategoryWithChildren[];
  contact: ContactSetting;
}) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { mounted, visible } = useDisclosureAnimation(open, 150);

  useEffect(() => {
    if (!mounted || !drawerRef.current) return;

    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable[0] ?? drawerRef.current).focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;

      const items = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = original;
    };
  }, [mounted]);

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

      {mounted && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className={cn(
              "absolute inset-0 bg-ink-900/40 transition-opacity ease-out-soft",
              visible ? "opacity-100 duration-200" : "opacity-0 duration-150"
            )}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={fa.header.openMenu}
            tabIndex={-1}
            className={cn(
              // Panel is docked at the logical-start edge (visual right under
              // dir="rtl"); hidden state pushes it off that edge.
              "absolute inset-y-0 start-0 flex w-[85vw] max-w-sm flex-col overscroll-contain bg-surface shadow-lg transition-transform ease-out-soft focus:outline-none",
              visible ? "translate-x-0 duration-200" : "translate-x-full duration-150"
            )}
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

            <nav className="flex-1 overflow-y-auto overscroll-contain p-4">
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
                            aria-label={fa.header.expandCategory(cat.name)}
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
