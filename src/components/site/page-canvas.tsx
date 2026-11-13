import type { ReactNode } from "react";

import { DecorBlob } from "./decor-blob";

/**
 * One continuous background behind a page's sections, so gradients never stop at a section
 * edge (DESIGN.md § 1.1). Sections on top stay transparent (`Section` tone "canvas"); a section
 * may still opt into its own surface (e.g. a sheet) when the break is intentional.
 */
export function PageCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex flex-1 flex-col overflow-x-clip bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        {/* Soft teal haze that fades out over the first screens instead of ending at a line. */}
        <span className="absolute inset-x-0 top-0 h-[min(140vh,1400px)] bg-linear-to-b from-teal-50 via-teal-50/40 to-transparent" />
        <DecorBlob tone="primary" className="top-[28rem] -left-40 size-[34rem] opacity-70" />
        <DecorBlob tone="highlight" className="top-[60rem] -right-48 size-[30rem] opacity-50" />
      </div>
      {children}
    </div>
  );
}
