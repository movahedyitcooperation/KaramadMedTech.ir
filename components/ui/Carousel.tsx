"use client";

import { CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react/dist/ssr";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { DirIcon } from "@/components/ui/DirIcon";
import { useOnScreen } from "@/hooks/useOnScreen";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { toPersianDigits } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils/cn";

interface SlidesPerView {
  base: number;
  sm?: number;
  md?: number;
  lg?: number;
}

interface CarouselProps {
  slides: ReactNode[];
  ariaLabel: string;
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  showDots?: boolean;
  slidesPerView?: SlidesPerView;
  className?: string;
  slideClassName?: string;
}

function useResponsiveSlidesPerView(bp: SlidesPerView) {
  const [count, setCount] = useState(bp.base);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1024 && bp.lg) setCount(bp.lg);
      else if (w >= 768 && bp.md) setCount(bp.md);
      else if (w >= 640 && bp.sm) setCount(bp.sm);
      else setCount(bp.base);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [bp.base, bp.sm, bp.md, bp.lg]);

  return count;
}

/**
 * Shared accessible carousel used by both the hero slider and the product
 * carousels. Always-visible prev/next buttons (single-pointer alternative to
 * swipe), full keyboard support, and autoplay that respects hover/focus/
 * off-screen/reduced-motion — see docs/ROADMAP.md Phase 3 and the plan's
 * carousel a11y notes.
 */
export function Carousel({
  slides,
  ariaLabel,
  autoplay = false,
  autoplayIntervalMs = 5000,
  showDots = false,
  slidesPerView = { base: 1 },
  className,
  slideClassName,
}: CarouselProps) {
  const perView = useResponsiveSlidesPerView(slidesPerView);
  const maxIndex = Math.max(0, slides.length - perView);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(containerRef);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Derived at render time (instead of synced via effect) so a perView change
  // from a resize never leaves index pointing past the new last valid slide.
  const clampedIndex = Math.min(index, maxIndex);

  const goTo = useCallback(
    (next: number) => {
      const span = maxIndex + 1;
      setIndex(((next % span) + span) % span);
    },
    [maxIndex]
  );

  const goNext = useCallback(() => goTo(clampedIndex + 1), [goTo, clampedIndex]);
  const goPrev = useCallback(() => goTo(clampedIndex - 1), [goTo, clampedIndex]);

  const autoplayActive =
    autoplay &&
    isPlaying &&
    !isHovered &&
    !isFocused &&
    isOnScreen &&
    !prefersReducedMotion &&
    maxIndex > 0;

  useEffect(() => {
    if (!autoplayActive) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % (maxIndex + 1));
    }, autoplayIntervalMs);
    return () => clearInterval(timer);
  }, [autoplayActive, autoplayIntervalMs, maxIndex]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(maxIndex);
    }
  }

  const offsetPercent = (clampedIndex * 100) / perView;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocused(false);
      }}
      className={cn("relative", className)}
    >
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(${offsetPercent}%)`,
            transition: prefersReducedMotion ? "none" : "transform 500ms var(--ease-out-soft)",
          }}
        >
          {slides.map((slide, i) => {
            const hidden = i < clampedIndex || i >= clampedIndex + perView;
            return (
              <div
                key={i}
                className={cn("shrink-0", slideClassName)}
                style={{ flexBasis: `${100 / perView}%` }}
                aria-hidden={hidden}
                inert={hidden ? true : undefined}
              >
                {slide}
              </div>
            );
          })}
        </div>
      </div>

      {maxIndex > 0 && (
        <>
          <button
            type="button"
            onClick={goNext}
            aria-label={fa.common.next}
            className="absolute end-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink-900 shadow-soft hover:bg-surface"
          >
            <DirIcon icon={CaretRight} size={20} />
          </button>
          <button
            type="button"
            onClick={goPrev}
            aria-label={fa.common.prev}
            className="absolute start-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink-900 shadow-soft hover:bg-surface"
          >
            <DirIcon icon={CaretLeft} size={20} />
          </button>
        </>
      )}

      {autoplay && maxIndex > 0 && (
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? fa.home.pauseAutoplay : fa.home.playAutoplay}
          className="absolute bottom-4 start-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink-900 shadow-soft hover:bg-surface"
        >
          {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
      )}

      {showDots && maxIndex > 0 && (
        <div className="absolute bottom-4 start-1/2 z-10 flex -translate-x-1/2 gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={fa.home.slideLabel(toPersianDigits(i + 1), toPersianDigits(maxIndex + 1))}
              aria-current={i === clampedIndex}
              className={cn(
                "h-2.5 cursor-pointer rounded-full transition-all duration-200",
                i === clampedIndex ? "w-6 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
