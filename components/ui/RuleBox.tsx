import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface RuleBoxProps {
  items: ReactNode[];
  /** "surface" (default) for the service-cells use on a light page;
   * "emerald" for the trust-band use on the emerald ground. */
  tone?: "surface" | "emerald";
  className?: string;
  itemClassName?: string;
}

/** One box divided by hairlines — for content that reads as a set, not a
 * collection of individual cards (service cells, trust badges). No
 * shadow, no per-item radius: the divider IS a 1px gap showing the
 * container's background through it. */
export function RuleBox({ items, tone = "surface", className, itemClassName }: RuleBoxProps) {
  const isEmerald = tone === "emerald";
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-7",
        isEmerald ? "bg-bone/14" : "border border-line bg-line",
        className
      )}
    >
      {items.map((item, i) => (
        <div key={i} className={cn("p-6", isEmerald ? "bg-emerald text-bone" : "bg-surface", itemClassName)}>
          {item}
        </div>
      ))}
    </div>
  );
}
