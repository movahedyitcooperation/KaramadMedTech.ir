import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** Emerald ground, reversed (bone) text — used only "where the site is
 * speaking rather than listing" (CLAUDE.md §3): PDP key-specs, the cart's
 * honest checkout-not-live-yet terminal card, the mega-menu panel. Never
 * used for an ordinary product/content card. */
export function HighlightCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("on-emerald rounded-6 bg-emerald p-6 text-bone", className)}
      {...props}
    />
  );
}
