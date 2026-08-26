import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Pill({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2 text-sm text-ink-900",
        className
      )}
      {...props}
    />
  );
}
