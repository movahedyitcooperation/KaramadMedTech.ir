"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import type { ProductImage } from "@/lib/types/product";
import { cn } from "@/lib/utils/cn";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];
  const trackRef = useRef<HTMLDivElement>(null);

  // On the mobile swipe track, keep the dots in sync with whichever slide is
  // centred. IntersectionObserver sidesteps the cross-browser RTL scrollLeft
  // mess.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length < 2) return;

    const slides = Array.from(track.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;
        const i = slides.indexOf(mostVisible.target as HTMLElement);
        if (i >= 0) setActiveIndex(i);
      },
      { root: track, threshold: [0.5, 0.75, 1] }
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [images.length]);

  function scrollToSlide(i: number) {
    (trackRef.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  // Both layouts render every image; the hidden branch's images are lazy, so a
  // breakpoint only pays for the set it actually shows.
  return (
    <div>
      {/* Mobile: native horizontal swipe */}
      <div className="md:hidden">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain"
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square w-full shrink-0 snap-center overflow-hidden rounded-card border border-line bg-brand-50"
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                priority={i === 0}
                className="object-contain p-8"
                sizes="92vw"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-3">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToSlide(i)}
                aria-label={fa.product.galleryThumbnail(toPersianDigits(i + 1))}
                aria-current={i === activeIndex}
                className={cn(
                  "relative h-2 cursor-pointer rounded-full transition-[width,background-color] duration-200 after:absolute after:-inset-x-1 after:-inset-y-4 after:content-['']",
                  i === activeIndex ? "w-6 bg-brand-600" : "w-2 bg-line-strong"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tablet / desktop: main image with a thumbnail strip */}
      <div className="hidden md:block">
        <div className="relative aspect-square overflow-hidden rounded-card border border-line bg-brand-50">
          {active && (
            <Image
              src={active.url}
              alt={active.alt}
              fill
              priority
              className="object-contain p-10 transition-transform duration-300 hover:scale-110"
              sizes="40vw"
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
    </div>
  );
}
