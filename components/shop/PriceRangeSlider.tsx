"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { useEffect, useId, useRef, useState } from "react";

import { toPersianNumber } from "@/lib/format";
import { fa } from "@/lib/i18n/fa";

interface PriceRangeSliderProps {
  /** Lowest and highest price the track spans — the price-independent facet
   * bounds for the current query, so dragging the handles never moves the
   * ends. Rounded outward to a whole step here. */
  boundMin: number;
  boundMax: number;
  /** Current selection from the URL, or null for "no bound on this side".
   * Null rests the handle on the matching track end. */
  valueMin: number | null;
  valueMax: number | null;
  /** Fired on release — never on every drag frame. A handle resting on its
   * track end is reported as null so the URL is not pinned to a bound that
   * would shift the next time results change. */
  onCommit: (min: number | null, max: number | null) => void;
}

/** A readable increment for the span — coarse over a catalogue-wide range,
 * finer inside a single category. */
function stepFor(span: number): number {
  if (span >= 10_000_000) return 100_000;
  if (span >= 2_000_000) return 50_000;
  if (span >= 500_000) return 20_000;
  return 10_000;
}

/**
 * Dual-handle price range, on Radix's slider primitive: it owns the pointer,
 * touch and keyboard behaviour (including picking the nearer thumb when the
 * two meet), and `onValueCommit` gives the exact "user let go" moment the URL
 * push needs — so a drag repaints locally and only the release navigates.
 *
 * Held LTR (low → high, left → right) inside the RTL page: a numeric range
 * reads the same way in both scripts.
 *
 * Uncontrolled from the URL's point of view — the parent keys it on the URL
 * value and the bounds, so a change from outside (a filter cleared, the back
 * button, a brand narrowing the range) re-mounts it rather than an effect
 * racing the drag.
 */
export function PriceRangeSlider({
  boundMin,
  boundMax,
  valueMin,
  valueMax,
  onCommit,
}: PriceRangeSliderProps) {
  const step = stepFor(boundMax - boundMin);
  const min = Math.floor(boundMin / step) * step;
  const max = Math.max(min + step, Math.ceil(boundMax / step) * step);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const [values, setValues] = useState<number[]>(() => [
    clamp(valueMin ?? min),
    clamp(valueMax ?? max),
  ]);
  const [lo, hi] = values;

  // Radix commits on every keyup, so arrowing along the track would fire one
  // navigation per keystroke. Coalescing them keeps a held arrow key to a
  // single push, and is short enough that a pointer release still feels
  // immediate.
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
  }, []);

  const commitDebounced = (next: number[]) => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      onCommit(next[0] <= min ? null : next[0], next[1] >= max ? null : next[1]);
    }, 250);
  };

  const labelId = useId();

  return (
    <div dir="ltr">
      {/* Bare numbers, no repeated unit: «محدوده قیمت (تومان)» above already
       * states it, and printing "تومان" beside both ends overflowed the 268px
       * sidebar once both values reached seven digits — each span wrapped and
       * the whole control grew a line taller mid-drag. nowrap keeps a
       * formatted number from ever breaking across lines. */}
      <div
        id={labelId}
        aria-live="polite"
        className="mb-3 flex items-center justify-between gap-2 text-13 tabular-nums whitespace-nowrap text-ink/80"
      >
        <span>{toPersianNumber(lo)}</span>
        <span className="text-ink/35">—</span>
        <span>{toPersianNumber(hi)}</span>
      </div>

      <SliderPrimitive.Root
        dir="ltr"
        min={min}
        max={max}
        step={step}
        value={values}
        onValueChange={setValues}
        onValueCommit={commitDebounced}
        aria-describedby={labelId}
        className="relative flex h-5 w-full touch-none items-center select-none"
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-pill bg-line">
          <SliderPrimitive.Range className="absolute h-full bg-emerald-live" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={fa.category.priceMinAria}
          className="block size-[18px] cursor-pointer rounded-pill border-2 border-emerald-live bg-surface shadow-[0_1px_4px_rgb(12_58_44/0.28)] transition-transform duration-(--duration-state) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-live active:scale-110"
        />
        <SliderPrimitive.Thumb
          aria-label={fa.category.priceMaxAria}
          className="block size-[18px] cursor-pointer rounded-pill border-2 border-emerald-live bg-surface shadow-[0_1px_4px_rgb(12_58_44/0.28)] transition-transform duration-(--duration-state) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-live active:scale-110"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
