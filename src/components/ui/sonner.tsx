"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Toasts: top-center on phones (thumb-free zone), bottom-right on desktop (DESIGN.md § 4). */
function Toaster(props: ToasterProps) {
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );

  return (
    <Sonner
      position={isDesktop ? "bottom-right" : "top-center"}
      gap={12}
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg! border! border-border/70! bg-popover! font-sans! text-popover-foreground! shadow-lg!",
          title: "text-label!",
          description: "text-body-sm! text-muted-foreground!",
          success: "[&_[data-icon]]:text-success!",
          error: "[&_[data-icon]]:text-destructive!",
          info: "[&_[data-icon]]:text-info!",
          warning: "[&_[data-icon]]:text-warning!",
        },
      }}
      style={{ zIndex: "var(--z-toast)" } as CSSProperties}
      {...props}
    />
  );
}

export { Toaster };
