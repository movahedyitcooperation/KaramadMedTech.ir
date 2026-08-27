"use client";

import { Star } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

interface RatingProps {
  value: number;
  max?: number;
  size?: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export function Rating({
  value,
  max = 5,
  size = 18,
  readOnly = true,
  onChange,
  className,
}: RatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  if (readOnly) {
    return (
      <div
        className={cn("inline-flex items-center gap-0.5", className)}
        role="img"
        aria-label={`${toPersianDigits(value)} از ${toPersianDigits(max)}`}
      >
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            size={size}
            weight={i < Math.round(value) ? "fill" : "regular"}
            className={i < Math.round(value) ? "text-accent-500" : "text-line-strong"}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type="button"
            aria-label={`امتیاز ${toPersianDigits(starValue)} از ${toPersianDigits(max)}`}
            aria-pressed={value === starValue}
            onMouseEnter={() => setHover(starValue)}
            onFocus={() => setHover(starValue)}
            onBlur={() => setHover(null)}
            onClick={() => onChange?.(starValue)}
            className="cursor-pointer p-0.5"
          >
            <Star
              size={size}
              weight={starValue <= display ? "fill" : "regular"}
              className={starValue <= display ? "text-accent-500" : "text-line-strong"}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
