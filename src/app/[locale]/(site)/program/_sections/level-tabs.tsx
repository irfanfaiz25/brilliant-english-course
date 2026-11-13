"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type LevelTab = { slug: string; label: string; age: string };

/**
 * Sticky level switcher with scroll-spy (DESIGN.md § 5.2 Program).
 * - Plain `#slug` anchors: they work without JS and scroll smoothly (global `scroll-behavior`).
 * - IntersectionObserver marks the level whose top most recently passed the top 40% of the viewport.
 * - A pill slides under the current tab (measured position, CSS transform transition).
 */
export function LevelTabs({ tabs, label }: { tabs: readonly LevelTab[]; label: string }) {
  const [current, setCurrent] = useState(tabs[0]?.slug ?? "");
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  // Scroll-spy: the root is the top 40% of the viewport. Of the levels intersecting it, the last
  // one in page order is current — the level whose top has most recently passed that line.
  useEffect(() => {
    const order = tabs.map((tab) => tab.slug);
    const sections = order
      .map((slug) => document.getElementById(slug))
      .filter((section): section is HTMLElement => section !== null);
    const intersecting = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id);
          else intersecting.delete(entry.target.id);
        }
        const latest = order.filter((slug) => intersecting.has(slug)).at(-1);
        if (latest) setCurrent(latest);
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [tabs]);

  // Move the pill under the current tab. Offsets are relative to the list (the pill's positioned
  // container); on small screens the list also scrolls horizontally to keep the tab in view.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const link = linkRefs.current.get(current);
      if (!link) return;
      setIndicator({ x: link.offsetLeft, width: link.offsetWidth, ready: true });

      const hiddenLeft = link.offsetLeft < list.scrollLeft;
      const hiddenRight = link.offsetLeft + link.offsetWidth > list.scrollLeft + list.clientWidth;
      if (hiddenLeft || hiddenRight) {
        list.scrollTo({
          left: link.offsetLeft - list.clientWidth / 2 + link.offsetWidth / 2,
          behavior: "smooth",
        });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [current]);

  return (
    <nav
      aria-label={label}
      className="sticky top-16 z-(--z-sticky) border-y border-border/60 surface-glass py-2 md:top-20"
    >
      <ul
        ref={listRef}
        className="relative mx-auto flex w-fit max-w-full [scrollbar-width:none] gap-1 overflow-x-auto rounded-full p-1"
      >
        <span
          aria-hidden
          style={{ translate: `${indicator.x}px 0`, width: indicator.width }}
          className={cn(
            "absolute top-1 bottom-1 left-0 rounded-full bg-primary shadow-glow-primary transition-[translate,width,opacity] duration-(--duration-slow) ease-out",
            indicator.ready ? "opacity-100" : "opacity-0",
          )}
        />
        {tabs.map((tab) => {
          const active = tab.slug === current;
          return (
            // Not positioned, so each link's offsetParent is the list.
            <li key={tab.slug} className="shrink-0">
              <a
                ref={(node) => {
                  if (node) linkRefs.current.set(tab.slug, node);
                  else linkRefs.current.delete(tab.slug);
                }}
                href={`#${tab.slug}`}
                aria-current={active ? "location" : undefined}
                onClick={() => setCurrent(tab.slug)}
                className={cn(
                  // `relative` paints the label above the sliding pill.
                  "relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-label whitespace-nowrap transition-colors duration-(--duration-base) sm:px-5",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "text-caption",
                    active ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {tab.age}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
