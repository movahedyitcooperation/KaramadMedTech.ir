"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fa } from "@/lib/i18n/fa";

/**
 * Whether the mobile filter sheet is open.
 *
 * This is the only piece of genuinely client-side state on the category page
 * — every actual filter lives in the URL. It needs a context rather than
 * local state because the button that opens the sheet sits in the page
 * header row while the sheet itself sits in the results grid: two different
 * parents, one boolean.
 */
const FiltersSheetContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  /** True only while the panel is actually a sheet (below lg). The SAME
   * element is the static desktop sidebar from 1024px up, so `inert` has to
   * be gated on this — an unconditional `inert={!open}` would make the
   * desktop filters unreachable. Mirrors the 1023px breakpoint that
   * `.km-filters` uses in globals.css. */
  isSheet: boolean;
} | null>(null);

export function FiltersSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Starts false so the server-rendered desktop sidebar is never inert; the
  // effect corrects it on the client before the visitor can Tab anywhere.
  const [isSheet, setIsSheet] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Escape closes the sheet and focus goes back to whatever opened it —
  // the same contract MobileNavDrawer already honours.
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = original;
      openerRef.current?.focus?.();
    };
  }, [open]);

  return (
    <FiltersSheetContext.Provider value={{ open, setOpen, isSheet }}>
      {children}
      {open && (
        // Scrim for the sheet; .km-fbackdrop hides it from lg upwards, where
        // the same element is a static sidebar instead.
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className="km-fbackdrop fixed inset-0 z-81 bg-emerald/50"
        />
      )}
    </FiltersSheetContext.Provider>
  );
}

export function useFiltersSheet() {
  const ctx = useContext(FiltersSheetContext);
  if (!ctx) throw new Error("useFiltersSheet must be used inside FiltersSheetProvider");
  return ctx;
}

/** The phone-only trigger, shown beside the sort control. */
export function FiltersSheetTrigger() {
  const { setOpen } = useFiltersSheet();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="cursor-pointer rounded-4 bg-ink px-5 py-3 text-14 font-semibold text-surface lg:hidden"
    >
      {fa.category.filtersButton}
    </button>
  );
}
