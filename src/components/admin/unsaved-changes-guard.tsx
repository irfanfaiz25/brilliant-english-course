"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "./confirm-dialog";

/** Same-origin link the click would follow inside the app, or `null` for anything else. */
function internalHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = (event.target as Element | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  const here = window.location.pathname + window.location.search;
  if (url.pathname + url.search === here) return null;
  return url.pathname + url.search + url.hash;
}

/**
 * Asks before leaving a form with unsaved changes (DESIGN.md § 6): the browser prompt covers
 * reload and closing the tab; in-app links (sidebar, breadcrumbs, back) open a confirm dialog.
 */
export function UnsavedChangesGuard({ when }: { when: boolean }) {
  const t = useTranslations("AdminForms.unsavedGuard");
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    const onClick = (event: MouseEvent) => {
      const href = internalHref(event);
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    // Capture phase: runs before Next's <Link> handler navigates.
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [when]);

  return (
    <ConfirmDialog
      open={pendingHref !== null}
      onOpenChange={(open) => !open && setPendingHref(null)}
      title={t("title")}
      description={t("body")}
      confirmLabel={t("leave")}
      destructive
      onConfirm={() => {
        if (pendingHref) router.push(pendingHref);
        setPendingHref(null);
      }}
    />
  );
}
