"use client";

import type { ElementType, ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils/cn";

interface RevealProps {
  children: ReactNode;
  /** Wrapper element. Defaults to a plain `div`. */
  as?: ElementType;
  className?: string;
  /** Nudge the trigger point; forwarded to the IntersectionObserver rootMargin. */
  rootMargin?: string;
}

/**
 * Marks its subtree for a scroll-triggered entrance. Descendants opt in with
 * the `reveal-rise` / `reveal-mark` utilities (see globals.css) and an
 * optional `--reveal-delay` for a capped stagger. The wrapper itself only
 * carries `data-revealed`; it adds no visual style of its own.
 */
export function Reveal({ children, as, className, rootMargin }: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, revealed } = useReveal<HTMLElement>(rootMargin);

  return (
    <Tag ref={ref} data-revealed={revealed} className={cn(className)}>
      {children}
    </Tag>
  );
}
