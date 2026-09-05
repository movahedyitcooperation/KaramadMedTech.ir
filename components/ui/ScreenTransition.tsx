import type { ReactNode } from "react";

interface ScreenTransitionProps {
  /** An explicit screen-identity key (e.g. "home", "category:<slug>",
   * "product:<slug>", "account:<tab>") — deliberately NOT derived from
   * usePathname()/searchParams, so a filter or page-number change inside
   * one screen never replays the crossfade; only navigating to a
   * genuinely different screen does. Each page supplies its own key. */
  screenKey: string;
  children: ReactNode;
}

/** Route/screen crossfade. Plain CSS (`km-route` in globals.css), keyed via
 * React's `key` prop for the "mount animation fires once" mechanism — no
 * animation library needed. */
export function ScreenTransition({ screenKey, children }: ScreenTransitionProps) {
  return (
    <div key={screenKey} className="km-route">
      {children}
    </div>
  );
}
