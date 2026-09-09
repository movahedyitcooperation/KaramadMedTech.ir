"use client";

import Image from "next/image";
import { useState } from "react";
import { fa } from "@/lib/i18n/fa";
import type { ProductImage } from "@/lib/types/product";
import { cn } from "@/lib/utils/cn";

// Deliberately neutral: a placeholder must not depict a product it is not.
// Keying this off the department would mean threading the category tree
// through every card, and a rehab placeholder is still a placeholder.
const IMAGE_FALLBACK = "/images/placeholders/product.svg";

/**
 * Main image plus, only when there is more than one, a thumbnail strip.
 *
 * A single-image product shows just the one image: padding it out to four
 * identical clones reads as a rendering bug, not as a gallery. The main image
 * keeps the hover zoom (`.j-zoom`) because inspecting the product closely is
 * a real need here — it is the one zoom in the whole design.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const list: ProductImage[] =
    images.length > 0 ? images : [{ url: IMAGE_FALLBACK, alt: productName, sortOrder: 0 }];
  const main = list[Math.min(active, list.length - 1)];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="j-zoom aspect-square overflow-hidden rounded-4 border border-ink/10 bg-surface">
        <Image
          src={main.url}
          alt={main.alt || productName}
          width={1385}
          height={1385}
          priority
          className="block size-full bg-img-bg object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>

      {list.length > 1 && (
        <div className="flex gap-2.5">
          {list.slice(0, 4).map((image, i) => (
            <button
              key={`${image.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={fa.pdp.thumb(i + 1)}
              aria-current={i === active}
              className={cn(
                "size-19 cursor-pointer overflow-hidden rounded-3 border bg-img-bg p-0",
                i === active ? "border-emerald" : "border-ink/14"
              )}
            >
              <Image
                src={image.url}
                alt=""
                width={152}
                height={152}
                loading="lazy"
                className="block size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
