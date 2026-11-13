"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";

import { useRouter } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";

type UrlQuery = Record<string, string>;

type UrlStateContextValue = {
  /** True while the server renders the page for the new search params. */
  isPending: boolean;
  /** Replaces the page's query (no history entry, no scroll jump) inside a transition. */
  navigate: (query: UrlQuery) => void;
};

const UrlStateContext = createContext<UrlStateContextValue | null>(null);

export function useUrlState(): UrlStateContextValue {
  const context = useContext(UrlStateContext);
  if (!context) throw new Error("useUrlState must be used inside <UrlStateShell>");
  return context;
}

/**
 * Client boundary for pages whose state lives in the URL (unit finder, quota checker — ADR-017).
 * Controls update the query through `navigate`; the server re-renders for the new search params
 * while the current UI stays on screen, dimmed via `isPending` — no skeleton flash.
 */
export function UrlStateShell({
  pathname,
  children,
}: {
  pathname: StaticPathname;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (query: UrlQuery) => {
    startTransition(() => {
      router.replace({ pathname, query }, { scroll: false });
    });
  };

  return <UrlStateContext value={{ isPending, navigate }}>{children}</UrlStateContext>;
}

/** Dims its children while new results load, and tells assistive tech the region is busy. */
export function PendingRegion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isPending } = useUrlState();
  return (
    <div
      aria-busy={isPending || undefined}
      data-pending={isPending || undefined}
      className={`transition-opacity duration-(--duration-base) ease-out data-pending:pointer-events-none data-pending:opacity-50 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
