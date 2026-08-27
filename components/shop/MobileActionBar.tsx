import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The fixed bottom action bar shared by the product and cart pages on small
 * screens: it carries the page's primary action (add to cart / checkout) once
 * the in-page control has scrolled out of view. Hidden from `md` up, where the
 * sticky in-page card takes over.
 *
 * `hidden` slides it out of the way and makes it inert rather than unmounting,
 * so the slide transition can play in both directions.
 */
export function MobileActionBar({
  children,
  hidden = false,
}: {
  children: ReactNode;
  hidden?: boolean;
}) {
  return (
    <div
      inert={hidden ? true : undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_20px_rgb(12_26_36/0.08)] backdrop-blur-md transition-transform duration-(--duration-base) ease-out-soft md:hidden",
        hidden ? "translate-y-full" : "translate-y-0"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6">{children}</div>
    </div>
  );
}
