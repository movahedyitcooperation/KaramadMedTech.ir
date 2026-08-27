"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface UseRevealResult<T extends Element> {
  ref: RefObject<T | null>;
  /**
   * `true` by default — SSR, no-JS, reduced motion, and anything on screen at
   * mount all stay visible. Flips to `false` only for elements still off screen
   * at mount, then back to `true`, for good, once they scroll into view.
   */
  revealed: boolean;
}

/**
 * One-shot in-view detector for entrance animations. The observer's own first
 * callback arms the entrance (hides elements that mount off screen); a later
 * callback releases it and disconnects. Content that was visible on load is
 * never touched, so a failed script or a throttled tab can't hide the page.
 */
export function useReveal<T extends Element>(
  rootMargin = "0px 0px -8% 0px"
): UseRevealResult<T> {
  const ref = useRef<T>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      return;
    }

    let armed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries[entries.length - 1]?.isIntersecting ?? false;
        if (inView) {
          setRevealed(true);
          observer.disconnect();
        } else if (!armed) {
          // First callback, element mounted off screen: hide it so the
          // scroll-in transition has somewhere to travel from.
          setRevealed(false);
        }
        armed = true;
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion, rootMargin]);

  return { ref, revealed };
}
