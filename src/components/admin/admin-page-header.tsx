import type { ReactNode } from "react";

import { AdminBreadcrumbs, type AdminCrumb } from "./admin-breadcrumbs";

type AdminPageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Primary actions on the right (buttons, links). */
  actions?: ReactNode;
  /**
   * Pages above this one, outermost first (Ringkasan is added); `[]` for a module's own page.
   * Only Ringkasan itself, the root, passes `false`.
   */
  breadcrumbs: readonly AdminCrumb[] | false;
  /** The page's name in the trail when the title says more ("Level Kindy" → "Kindy"). */
  crumb?: string;
};

/**
 * Title row of an admin page: where the page sits, the page's only `h1`, a short description and
 * its actions.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  crumb,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      {breadcrumbs && <AdminBreadcrumbs parents={breadcrumbs} current={crumb ?? title} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h2 text-foreground">{title}</h1>
          {description && <p className="text-body text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}
