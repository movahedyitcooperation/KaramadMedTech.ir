"use client";

import Image from "next/image";
import { useState } from "react";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { ProductImage } from "@/lib/types/product";
import { cn } from "@/lib/utils/cn";

export function ProductGallery({
  images,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-card border border-line bg-brand-50">
        {active && (
          <Image
            src={active.url}
            alt={active.alt}
            fill
            priority
            className="object-contain p-10 transition-transform duration-300 hover:scale-110"
            sizes="(min-width: 1024px) 40vw, 90vw"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={fa.product.galleryThumbnail(toPersianDigits(i + 1))}
              aria-current={i === activeIndex}
              className={cn(
                "relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-input border bg-brand-50",
                i === activeIndex ? "border-brand-600" : "border-line"
              )}
            >
              <Image src={img.url} alt="" fill className="object-contain p-2" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
