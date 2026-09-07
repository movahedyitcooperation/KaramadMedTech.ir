"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DepartmentMark } from "@/components/shop/DepartmentMark";
import { Button } from "@/components/ui/Button";
import { SearchGlyph } from "@/components/ui/SearchGlyph";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { Category } from "@/lib/types/category";
import type { ContactSetting } from "@/lib/types/settings";
import { resolveDepartment } from "@/lib/utils/department";
import { telHref } from "@/lib/utils/links";
import { cn } from "@/lib/utils/cn";

interface CategoryWithChildren extends Category {
  children: Category[];
}

/**
 * The mobile navigation sheet.
 *
 * Flat, not an accordion: every department shows its sub-categories as chips
 * immediately. With six departments of three children each the whole tree
 * fits in one scroll, and an accordion would add a tap to reach anything.
 *
 * Always mounted and driven by `data-open` so it has a real close transition
 * rather than an abrupt unmount; `inert` when closed takes it out of the tab
 * order and the accessibility tree entirely.
 */
export function MobileNavDrawer({
  categories,
  contact,
  loggedIn,
}: {
  categories: CategoryWithChildren[];
  contact: ContactSetting;
  loggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

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
        aria-label={fa.header.menu}
        className="j-hdr-ctl flex size-11 flex-col items-center justify-center gap-[5px] rounded-4 lg:hidden"
      >
        <span aria-hidden="true" className="block h-0.5 w-4.5 bg-current" />
        <span aria-hidden="true" className="block h-0.5 w-4.5 bg-current" />
        <span aria-hidden="true" className="block h-0.5 w-4.5 bg-current" />
      </button>

      <div
        className="fixed inset-0 z-100 flex lg:hidden"
        data-open={String(open)}
        inert={!open}
        style={{ visibility: open ? "visible" : "hidden" }}
      >
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-emerald/50 transition-opacity duration-(--duration-panel)",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={fa.mobileNav.title}
          className={cn(
            "relative ms-auto h-full w-[min(360px,88vw)] overflow-y-auto bg-surface p-6 transition-transform duration-(--duration-panel) ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-5 flex items-center justify-between">
            <strong className="text-[17px]">{fa.mobileNav.title}</strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={fa.mobileNav.close}
              className="size-9.5 cursor-pointer rounded-4 border border-ink/16 text-lg text-ink"
            >
              ×
            </button>
          </div>

          {categories.map((cat) => (
            <div key={cat.id} className="border-b border-ink/8 py-3">
              <Link
                href={`/category/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 text-start text-base font-bold"
              >
                <DepartmentMark
                  department={resolveDepartment(cat.slug)}
                  label={cat.name}
                  size={24}
                />
              </Link>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {cat.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/category/${child.slug}`}
                    onClick={() => setOpen(false)}
                    className="rounded-pill bg-page px-3 py-1.75 text-13 text-ink/75"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-5 flex flex-col gap-2.5">
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-4 border border-ink/14 bg-page px-4 py-3.5 text-start text-15 text-ink/72"
            >
              <SearchGlyph className="size-[18px]" />
              <span>{fa.mobileNav.search}</span>
            </Link>
            <Link href={loggedIn ? "/account" : "/login"} onClick={() => setOpen(false)}>
              <Button className="w-full rounded-4 py-3.5 font-semibold">
                {loggedIn ? fa.header.account : fa.header.login}
              </Button>
            </Link>
            <a
              href={telHref(contact.phone)}
              className="rounded-4 border border-ink/18 py-3.5 text-center text-15 text-ink"
            >
              {fa.mobileNav.call}
            </a>
            <span dir="ltr" className="text-center text-13 text-ink/55">
              {toPersianDigits(contact.phone)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
