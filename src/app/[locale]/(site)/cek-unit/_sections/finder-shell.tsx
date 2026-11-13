"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";

import { useRouter } from "@/i18n/navigation";

type FinderQuery = Record<string, string>;

type FinderContextValue = {
  /** True while the next results are being rendered on the server. */
  isPending: boolean;
  /** Replaces the finder URL state (no history entry, no scroll jump) inside a transition. */
  navigate: (query: FinderQuery) => void;
};

const FinderContext = createContext<FinderContextValue | null>(null);

export function useFinder(): FinderContextValue {
  const context = useContext(FinderContext);
  if (!context) throw new Error("useFinder must be used inside <FinderShell>");
  return context;
}

/**
 * Client boundary for the unit finder. Filters update the URL through `navigate`; the server
 * re-renders results for the new search params while the current ones stay on screen, dimmed
 * via `isPending` — no skeleton flash between searches.
 */
export function FinderShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (query: FinderQuery) => {
    startTransition(() => {
      router.replace({ pathname: "/cek-unit", query }, { scroll: false });
    });
  };

  return <FinderContext value={{ isPending, navigate }}>{children}</FinderContext>;
}

/** Dims its children while new results load, and tells assistive tech the region is busy. */
export function PendingRegion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isPending } = useFinder();
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
