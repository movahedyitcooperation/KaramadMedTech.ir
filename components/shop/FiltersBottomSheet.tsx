"use client";

import { FunnelSimple, X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CategoryFilters } from "@/components/shop/CategoryFilters";
import { useDisclosureAnimation } from "@/hooks/useDisclosureAnimation";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils/cn";

interface FiltersBottomSheetProps {
  subcategories: { slug: string; name: string }[];
  brands: string[];
  values: {
    priceMin?: string;
    priceMax?: string;
    brands: string[];
    inStockOnly: boolean;
  };
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FiltersBottomSheet(props: FiltersBottomSheetProps) {
  const [open, setOpen] = useState(false);
  const { mounted, visible } = useDisclosureAnimation(open, 200);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted || !panelRef.current) return;

    const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable[0] ?? panelRef.current).focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
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
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-11 cursor-pointer items-center gap-2 rounded-pill border border-line bg-surface px-4 text-sm text-ink-900 hover:bg-bg"
      >
        <FunnelSimple size={16} aria-hidden="true" />
        {fa.category.openFilters}
      </button>

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className={cn(
                "absolute inset-0 bg-ink-900/40 transition-opacity ease-out-soft",
                visible ? "opacity-100 duration-200" : "opacity-0 duration-150"
              )}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={fa.category.filtersTitle}
              tabIndex={-1}
              className={cn(
                "absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overscroll-contain rounded-t-card bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgb(12_26_36/0.16)] transition-transform ease-out-soft focus:outline-none",
                visible ? "translate-y-0 duration-200" : "translate-y-full duration-150"
              )}
            >
              <div className="relative flex items-center justify-between border-b border-line px-4 pb-3 pt-4">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-1.5 mx-auto h-1 w-9 rounded-full bg-line-strong"
                />
                <h2 className="text-base font-bold text-ink-900">{fa.category.filtersTitle}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={fa.common.close}
                  className="tap-target -me-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-500 hover:bg-bg"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain p-4">
                <CategoryFilters {...props} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
