import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import { AdminPanel } from "@/components/admin/admin-panel";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getRecentActivity, type ActivityEntry } from "@/features/audit/admin-queries";
import type { SessionUser } from "@/features/users/schema";
import { can, type PermissionAction, type Resource } from "@/lib/permissions";

/** Where an entity of the audit log opens, and what the viewer needs to open it there. */
const entityLinks: Partial<
  Record<string, { path: (id: string) => string; need: [PermissionAction, Resource] }>
> = {
  partner_lead: { path: (id) => `${adminRoutes.leads}/${id}`, need: ["read", "leads"] },
  unit: { path: (id) => `${adminRoutes.units}/${id}`, need: ["update", "units"] },
  post: { path: (id) => `${adminRoutes.blog}/${id}`, need: ["update", "blog"] },
  user: { path: (id) => `${adminRoutes.users}/${id}`, need: ["update", "users"] },
  testimonial: {
    path: (id) => `${adminRoutes.testimonials}/${id}`,
    need: ["update", "testimonials"],
  },
  faq_item: { path: (id) => `${adminRoutes.faq}/${id}`, need: ["update", "faq"] },
  activity: { path: (id) => `${adminRoutes.activities}/${id}`, need: ["update", "activities"] },
  media_asset: { path: (id) => `${adminRoutes.media}/${id}`, need: ["read", "media"] },
  quota_reservation: { path: () => adminRoutes.quota, need: ["read", "quota"] },
};

/** A link for the entry, unless the entity is gone (deleted) or the viewer cannot open it. */
function linkFor(user: SessionUser, entry: ActivityEntry): string | null {
  if (entry.action.endsWith(".delete")) return null;
  const target = entityLinks[entry.entityType];
  if (!target || !can(user, ...target.need)) return null;
  return target.path(entry.entityId);
}

/**
 * "Aktivitas terbaru": the latest audit-log entries in words ("Rina mengubah unit"), newest first,
 * each linking to what changed when the viewer may open it.
 */
export async function RecentActivity({ user }: { user: SessionUser }) {
  const [t, format, entries] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.overview.activity" }),
    getFormatter({ locale: adminLocale }),
    getRecentActivity(user),
  ]);
  const now = new Date();
  const sentence = (entry: ActivityEntry) => {
    const actor = entry.actorName ?? t("system");
    const key = `actions.${entry.action}` as Parameters<typeof t>[0];
    return t.has(key) ? t(key, { actor }) : t("fallback", { actor });
  };

  return (
    <AdminPanel title={t("title")} description={t("description")}>
      {entries.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-body-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ol className="flex flex-col">
          {entries.map((entry) => {
            const href = linkFor(user, entry);
            return (
              <li key={entry.id} className="group relative flex gap-3 pb-4 last:pb-0">
                {/* Timeline rail and dot. */}
                <span
                  aria-hidden
                  className="absolute top-3 bottom-0 left-[5px] w-px bg-border group-last:hidden"
                />
                <span
                  aria-hidden
                  className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-card bg-primary"
                />
                <span className="flex min-w-0 flex-col gap-0.5 text-body-sm">
                  {href ? (
                    <Link
                      href={href}
                      className="rounded-sm text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {sentence(entry)}
                    </Link>
                  ) : (
                    <span className="text-foreground">{sentence(entry)}</span>
                  )}
                  <time
                    dateTime={entry.createdAt.toISOString()}
                    className="text-caption text-muted-foreground"
                  >
                    {format.relativeTime(entry.createdAt, now)}
                  </time>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </AdminPanel>
  );
}
