"use client";

import { ReviewsPlaceholder } from "@/components/shop/ReviewsPlaceholder";
import { SpecTable } from "@/components/shop/SpecTable";
import { Tabs } from "@/components/ui/Tabs";
import { fa } from "@/lib/i18n/fa";
import type { Product } from "@/lib/types/product";

export function ProductTabs({ product }: { product: Product }) {
  return (
    <Tabs
      items={[
        {
          id: "review",
          label: fa.product.tabs.review,
          content: (
            <div className="space-y-3 text-sm leading-relaxed text-ink-900">
              {product.description.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ),
        },
        {
          id: "specs",
          label: fa.product.tabs.specs,
          content: <SpecTable specs={product.specs} />,
        },
        {
          id: "reviews",
          label: fa.product.tabs.reviews,
          content: <ReviewsPlaceholder />,
        },
      ]}
    />
  );
}
