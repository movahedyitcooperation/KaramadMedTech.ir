"use client";

import { Minus, Plus } from "@phosphor-icons/react/dist/ssr";
import { fa } from "@/lib/i18n/fa";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  className,
}: QuantityStepperProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border border-line bg-surface p-1",
        className
      )}
    >
      <button
        type="button"
        aria-label={fa.cart.decreaseQty}
        disabled={!canDecrease}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-900 hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {toPersianDigits(value)}
      </span>
      <button
        type="button"
        aria-label={fa.cart.increaseQty}
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="tap-target flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-900 hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
