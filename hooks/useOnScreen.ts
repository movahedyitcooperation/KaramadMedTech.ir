"use client";

import { useEffect, useState, type RefObject } from "react";

export function useOnScreen<T extends Element>(ref: RefObject<T | null>): boolean {
  const [isOnScreen, setIsOnScreen] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => setIsOnScreen(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return isOnScreen;
}
