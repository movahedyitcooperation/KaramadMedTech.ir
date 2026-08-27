"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface DisclosureAnimation {
  /** Keep the node in the DOM through the exit transition. */
  mounted: boolean;
  /** Drives the enter/exit classes: `false` = resting/hidden, `true` = shown. */
  visible: boolean;
}

/**
 * Bridges a boolean `open` prop to mount/visible flags so an overlay can
 * animate both in and out: it mounts the node immediately, flips `visible` one
 * frame later to run the enter transition, and on close flips `visible` off
 * then unmounts after `exitMs`. Reduced motion collapses both waits.
 *
 * Consumers that measure or focus the node should key their own effect on
 * `mounted`, not the raw `open` prop, since the node is absent for the first
 * frame of an open.
 */
export function useDisclosureAnimation(open: boolean, exitMs = 180): DisclosureAnimation {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const rafRef = useRef(0);

  useEffect(() => {
    // This effect deliberately syncs render state to the `open` prop: mount/
    // unmount the node and toggle the enter/exit classes around it. The
    // one-frame cascade that lints against is the intended behaviour here.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      // Mount now; the enter transition is armed on the next frame, once the
      // resting styles have been committed.
      setMounted(true);
      if (prefersReducedMotion) {
        setVisible(true);
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(rafRef.current);
    }

    // Begin the exit transition immediately, then unmount once it has run.
    setVisible(false);
    if (prefersReducedMotion) {
      setMounted(false);
      return;
    }
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, prefersReducedMotion, exitMs]);

  return { mounted, visible };
}
