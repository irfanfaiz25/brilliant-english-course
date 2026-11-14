import { CheckIcon, MinusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AdminPanel } from "@/components/admin/admin-panel";
import { adminLocale } from "@/config/admin-routes";
import { userRoles, type UserRole } from "@/features/users/schema";
import {
  isUnitScoped,
  permissionActions,
  resourceActions,
  resources,
  type Grants,
  type Resource,
} from "@/lib/permissions";

type RoleMatrixProps = {
  /** Effective grants per role (configured for admin/editor, ADR-036). */
  grants: Record<UserRole, Grants>;
  /** "Atur hak akses" for super admins. */
  actions?: ReactNode;
};

/**
 * "Hak akses per peran", read-only: what each role may do right now, from the same grants the
 * server checks. A table (modules × roles) from `md`; below it, one list per role with only the
 * modules it can open, so phones never scroll sideways.
 */
export async function RoleMatrix({ grants, actions }: RoleMatrixProps) {
  const [t, tRole] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminUsers.matrix" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.role" }),
  ]);

  /** The allowed actions in words, "Akses penuh" when all of the module's actions are, or `null`. */
  const allowedText = (role: UserRole, resource: Resource): string | null => {
    const allowed = permissionActions.filter((action) => grants[role][resource]?.includes(action));
    if (allowed.length === 0) return null;
    if (resourceActions[resource].every((action) => allowed.includes(action))) return t("full");
    return allowed.map((action) => t(`actions.${action}`)).join(", ");
  };

  const cell = (role: UserRole, resource: Resource) => {
    const text = allowedText(role, resource);
    if (!text) {
      return (
        <span className="flex items-center text-muted-foreground">
          <MinusIcon aria-hidden className="size-4" />
          <span className="sr-only">{t("none")}</span>
        </span>
      );
    }
    return (
      <span className="flex items-start gap-1.5 text-foreground">
        <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-success-strong" />
        <span>
          {text}
          {isUnitScoped(role) && (
            <span className="block text-caption text-muted-foreground">{t("ownUnit")}</span>
          )}
        </span>
      </span>
    );
  };

  return (
    <AdminPanel title={t("title")} description={t("description")} actions={actions}>
      <table className="hidden w-full text-left md:table">
        <caption className="sr-only">{t("title")}</caption>
        <thead>
          <tr className="border-b border-border/60 text-caption font-semibold text-muted-foreground">
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("module")}
            </th>
            {userRoles.map((role) => (
              <th key={role} scope="col" className="py-3 pr-4 font-semibold">
                {tRole(role)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {resources.map((resource) => (
            <tr key={resource} className="align-top">
              <th scope="row" className="py-2.5 pr-4 text-body-sm font-semibold text-foreground">
                {t(`resources.${resource}`)}
              </th>
              {userRoles.map((role) => (
                <td key={role} className="py-2.5 pr-4 text-body-sm">
                  {cell(role, resource)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col divide-y divide-border/60 md:hidden">
        {userRoles.map((role) => (
          <section key={role} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
            <h3 className="text-label text-foreground">{tRole(role)}</h3>
            <dl className="flex flex-col gap-1.5 text-body-sm">
              {resources
                .filter((resource) => allowedText(role, resource) !== null)
                .map((resource) => (
                  <div key={resource} className="grid grid-cols-5 gap-3">
                    <dt className="col-span-2 text-muted-foreground">
                      {t(`resources.${resource}`)}
                    </dt>
                    <dd className="col-span-3">{cell(role, resource)}</dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
      </div>
    </AdminPanel>
  );
}
