"use client";

import { useEffect, useRef } from "react";

/**
 * Invisible 1 px sentinel at the top of the page. When it scrolls out of view the header gets
 * `data-scrolled="true"` and switches to its elevated look. No scroll listeners.
 */
export function HeaderScrollState({ headerId }: { headerId: string }) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = document.getElementById(headerId);
    const node = sentinel.current;
    if (!header || !node) return;

    const observer = new IntersectionObserver(([entry]) => {
      header.dataset.scrolled = String(!entry?.isIntersecting);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [headerId]);

  return (
    <div ref={sentinel} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" />
  );
}
