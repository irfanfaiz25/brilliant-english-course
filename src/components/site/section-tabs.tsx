"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type SectionTab = {
  /** Id of the section the tab scrolls to. */
  slug: string;
  label: string;
  /** Secondary text after the label, e.g. an age range. */
  meta?: string;
};

/** Upper bound for a smooth anchor scroll, after which scroll-spy resumes anyway. */
const SCROLL_LOCK_FALLBACK_MS = 1500;
/** Pixel tolerance when checking that an anchor target reached its scroll position. */
const ARRIVAL_TOLERANCE_PX = 4;

/** Whether an anchor target sits where the browser scrolls it (scroll-padding + scroll-margin). */
function hasArrived(target: HTMLElement): boolean {
  const offset =
    parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop || "0") +
    parseFloat(getComputedStyle(target).scrollMarginTop || "0");
  const atTarget = Math.abs(target.getBoundingClientRect().top - offset) <= ARRIVAL_TOLERANCE_PX;
  const atBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - ARRIVAL_TOLERANCE_PX;
  return atTarget || atBottom;
}

/**
 * Sticky in-page section switcher with scroll-spy (Program levels, Kemitraan sections; DESIGN.md § 5.2).
 * - Plain `#slug` anchors: they work without JS and scroll smoothly (global `scroll-behavior`).
 * - IntersectionObserver marks the section whose top most recently passed the top 40% of the viewport.
 * - A pill slides under the current tab (measured position, CSS transform transition).
 */
export function SectionTabs({ tabs, label }: { tabs: readonly SectionTab[]; label: string }) {
  const [current, setCurrent] = useState(tabs[0]?.slug ?? "");
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  /**
   * Set while a tab click scrolls the page. The smooth scroll passes the levels in between, and
   * letting scroll-spy react to those would make the pill jump back and forth (flicker).
   */
  const scrollLockRef = useRef<string | null>(null);
  /** Levels currently inside the scroll-spy band, kept across observer callbacks. */
  const intersectingRef = useRef(new Set<string>());

  /** The last level (in page order) inside the band — the one the reader is on. */
  const syncWithScroll = () => {
    const latest = tabs
      .map((tab) => tab.slug)
      .filter((slug) => intersectingRef.current.has(slug))
      .at(-1);
    if (latest) setCurrent(latest);
  };

  const lockUntilScrollEnds = (slug: string) => {
    const target = document.getElementById(slug);
    scrollLockRef.current = slug;

    const userInputs = ["wheel", "touchstart", "keydown"] as const;
    const release = () => {
      scrollLockRef.current = null;
      window.removeEventListener("scrollend", onScrollEnd);
      userInputs.forEach((type) => window.removeEventListener(type, onUserScroll));
      window.clearTimeout(fallback);
      // Whatever happened meanwhile, end up on the level that is actually on screen.
      syncWithScroll();
    };
    // Browsers may fire a `scrollend` before the smooth scroll even starts, so only release once
    // the target has arrived (or the page cannot scroll further). The timeout is a safety net.
    const onScrollEnd = () => {
      if (!target || hasArrived(target)) release();
    };
    // The visitor took over (wheel, touch, keys): hand control back to scroll-spy right away.
    const onUserScroll = () => release();
    const fallback = window.setTimeout(release, SCROLL_LOCK_FALLBACK_MS);
    window.addEventListener("scrollend", onScrollEnd);
    userInputs.forEach((type) => window.addEventListener(type, onUserScroll, { passive: true }));
  };

  // Scroll-spy: the root is the top 40% of the viewport. Of the levels intersecting it, the last
  // one in page order is current — the level whose top has most recently passed that line.
  useEffect(() => {
    const intersecting = intersectingRef.current;
    const sections = tabs
      .map((tab) => document.getElementById(tab.slug))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id);
          else intersecting.delete(entry.target.id);
        }
        if (!scrollLockRef.current) syncWithScroll();
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
    // `syncWithScroll` only reads refs and `tabs`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                onClick={() => {
                  setCurrent(tab.slug);
                  lockUntilScrollEnds(tab.slug);
                }}
                className={cn(
                  // `relative` paints the label above the sliding pill.
                  "relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-label whitespace-nowrap transition-colors duration-(--duration-base) sm:px-5",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {tab.meta && (
                  <span
                    className={cn(
                      "text-caption",
                      active ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {tab.meta}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
