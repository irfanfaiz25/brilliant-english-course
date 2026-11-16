import { ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Folds the step-by-step `RegionFilter` under the region search (ADR-047): closed until a region
 * is chosen, then open so the chosen path shows. A native `<details>`, so it also opens without JS.
 */
export function RegionBrowse({
  label,
  defaultOpen,
  children,
}: {
  label: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group flex flex-col">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg py-1 text-label text-primary marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDownIcon
          aria-hidden
          className="size-4 transition-transform duration-(--duration-fast) group-open:rotate-180"
        />
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
