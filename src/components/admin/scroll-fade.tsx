"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A scrolling body for a fixed-height panel (Ringkasan pairs, DESIGN.md § 6). While more content
 * waits below, the bottom edge fades out (a mask, so it works on glass) and a round arrow button
 * scrolls one view further; both disappear at the end. Focusable, so the keyboard can scroll it.
 */
export function ScrollFade({ children, className }: { children: ReactNode; className?: string }) {
  const t = useTranslations("AdminForms");
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // A pixel of slack: fractional heights never quite reach the end.
    const update = () =>
      setMore(element.scrollTop + element.clientHeight < element.scrollHeight - 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    for (const child of Array.from(element.children)) observer.observe(child);
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div className={cn("relative min-h-0", className)}>
      <div
        ref={ref}
        tabIndex={more ? 0 : -1}
        className={cn(
          "h-full overflow-y-auto overscroll-contain rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          more && "[mask-image:linear-gradient(to_bottom,black_75%,transparent)]",
        )}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label={t("scrollMore")}
        tabIndex={-1}
        onClick={() =>
          ref.current?.scrollBy({ top: ref.current.clientHeight * 0.8, behavior: "smooth" })
        }
        className={cn(
          "absolute bottom-1 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-md transition-[opacity,translate] duration-(--duration-base) hover:text-foreground",
          more ? "opacity-100" : "pointer-events-none translate-y-1 opacity-0",
        )}
      >
        <ChevronDownIcon aria-hidden className="size-4" />
      </button>
    </div>
  );
}
