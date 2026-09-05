import type { ReactNode } from "react";
import { Watermark } from "@/components/brand/Watermark";
import { cn } from "@/lib/utils/cn";

export interface PanelProps {
  title: string;
  body?: ReactNode;
  actions?: ReactNode;
  /** Dashed border for an empty/terminal state; solid for an active error
   * state (e.g. "loading failed, retry"). Defaults to dashed. */
  dashed?: boolean;
  /** Show the letterhead watermark. Defaults to true — set false for a
   * plain error panel where the decorative mark would feel wrong. */
  watermark?: boolean;
  /** Tints the watermark — pass a department "-deep" token when this panel
   * is shown mid-browse (e.g. a category's cleared-filters empty state). */
  tone?: string;
  className?: string;
}

/** The shared empty/terminal/error surface — cart empty state, category
 * "nothing matched your filters", account orders empty state, checkout's
 * honest "not live yet" panel. Not a generic Card: every other kind of
 * surface (product card, service cells, trust band, highlight card) has
 * its own dedicated component instead of inheriting from this one. */
export function Panel({ title, body, actions, dashed = true, watermark = true, tone, className }: PanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-6 bg-surface p-14 text-center sm:p-16",
        dashed ? "border border-dashed border-ink/22" : "border border-line",
        className
      )}
    >
      {watermark && <Watermark tone={tone} />}
      <strong className="relative block text-xl font-bold text-ink">{title}</strong>
      {body && (
        <p className="relative mx-auto mt-3 max-w-[48ch] text-15 leading-prose text-ink/72">{body}</p>
      )}
      {actions && (
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      )}
    </div>
  );
}
