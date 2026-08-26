"use client";

import { FunnelSimple } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { CategoryFilters } from "@/components/shop/CategoryFilters";
import { Modal } from "@/components/ui/Modal";
import { fa } from "@/lib/i18n/fa";

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

export function FiltersBottomSheet(props: FiltersBottomSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-pill border border-line bg-surface px-4 text-sm text-ink-900 hover:bg-bg"
      >
        <FunnelSimple size={16} aria-hidden="true" />
        {fa.category.openFilters}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={fa.category.filtersTitle}>
        <CategoryFilters {...props} />
      </Modal>
    </div>
  );
}
