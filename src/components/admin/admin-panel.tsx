import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ScrollFade } from "./scroll-fade";

type AdminPanelProps = {
  /** Anchor for in-page links (`#id`). */
  id?: string;
  title: string;
  description?: ReactNode;
  /** Small status line under the description, e.g. when the data was last changed. */
  meta?: ReactNode;
  /** Actions on the right of the title (buttons, links). */
  actions?: ReactNode;
  className?: string;
  /**
   * The body fills the panel's height and scrolls inside it, fading out while more follows (set
   * a height on the panel, e.g. to match the panel beside it).
   */
  scrollable?: boolean;
  children: ReactNode;
};

/**
 * Frosted content panel of an admin page (DESIGN.md § 6): an `h2` header with description and
 * meta, then the panel body. One panel per independent form or list.
 */
export function AdminPanel({
  id,
  title,
  description,
  meta,
  actions,
  className,
  scrollable = false,
  children,
}: AdminPanelProps) {
  const titleId = useId();
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        "flex scroll-mt-24 flex-col gap-6 rounded-2xl surface-glass-panel p-5 sm:p-6",
        className,
      )}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="text-h4 text-foreground">
            {title}
          </h2>
          {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
          {meta && <p className="text-caption text-muted-foreground">{meta}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </header>
      {scrollable ? <ScrollFade className="flex-1">{children}</ScrollFade> : children}
    </section>
  );
}
