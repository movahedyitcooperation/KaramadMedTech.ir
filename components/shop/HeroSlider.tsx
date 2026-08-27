"use client";

import Link from "next/link";
import { HeroBackground } from "@/components/shop/HeroBackground";
import { buttonVariants } from "@/components/ui/Button";
import { Carousel } from "@/components/ui/Carousel";
import { fa } from "@/lib/i18n/fa";
import type { HeroSlide } from "@/lib/types/settings";
import { cn } from "@/lib/utils/cn";

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const slideNodes = slides.map((slide) => {
    const parts = slide.title.split(slide.highlight);
    return (
      <div
        key={slide.id}
        className="relative flex min-h-[320px] items-center overflow-hidden rounded-card sm:min-h-[400px]"
      >
        <HeroBackground />
        <div className="relative max-w-xl px-6 py-12 sm:px-12">
          <h1 className="text-balance text-2xl font-bold leading-[1.5] text-white drop-shadow-sm sm:text-3xl lg:text-[2.5rem]">
            {parts.map((part, i) => (
              <span key={i}>
                {part}
                {i < parts.length - 1 && (
                  <span className="text-brand-100 underline decoration-accent-500 decoration-2 underline-offset-8">
                    {slide.highlight}
                  </span>
                )}
              </span>
            ))}
          </h1>
          <Link
            href={slide.ctaHref}
            className={cn(buttonVariants({ variant: "accent", size: "lg" }), "mt-7")}
          >
            {slide.ctaLabel}
          </Link>
        </div>
      </div>
    );
  });

  return (
    <Carousel
      slides={slideNodes}
      ariaLabel={fa.home.slidesRegionLabel}
      autoplay
      showDots
      slidesPerView={{ base: 1 }}
    />
  );
}
