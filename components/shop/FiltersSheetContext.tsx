"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
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
} | null>(null);

export function FiltersSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <FiltersSheetContext.Provider value={{ open, setOpen }}>
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
