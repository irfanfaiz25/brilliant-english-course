import { FileTextIcon, ImageIcon, PencilIcon, SearchXIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/row-actions";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminLocale, adminRoutes, adminTimeZone } from "@/config/admin-routes";
import { deletePostAction } from "@/features/blog/actions";
import type { AdminPostRow } from "@/features/blog/admin-queries";
import type { PostCategory } from "@/features/blog/schema";

type StatusKey = AdminPostRow["status"] | "scheduled";

const statusBadge = {
  draft: "neutral",
  published: "success",
  scheduled: "info",
  archived: "outline",
} as const satisfies Record<StatusKey, NonNullable<BadgeProps["variant"]>>;

type PostListProps = {
  rows: readonly AdminPostRow[];
  filtered: boolean;
  categoryLabels: Record<PostCategory, string>;
  canDelete: boolean;
  /** "now" of this render, for relative times. */
  now: Date;
};

/** Articles of one page: a table from `md`, cards below; title and thumbnail open the editor. */
export async function PostList({ rows, filtered, categoryLabels, canDelete, now }: PostListProps) {
  const [t, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminBlog" }),
    getFormatter({ locale: adminLocale }),
  ]);

  if (rows.length === 0) {
    const Icon = filtered ? SearchXIcon : FileTextIcon;
    return (
      <p className="flex flex-col items-center gap-3 rounded-xl bg-surface px-4 py-12 text-center text-body text-muted-foreground">
        <Icon aria-hidden className="size-8" />
        {filtered ? t("noResults") : t("empty")}
      </p>
    );
  }

  const href = (row: AdminPostRow) => `${adminRoutes.blog}/${row.id}`;
  const statusOf = (row: AdminPostRow): StatusKey => (row.scheduled ? "scheduled" : row.status);
  const status = (row: AdminPostRow) => (
    <Badge variant={statusBadge[statusOf(row)]} dot>
      {t(`status.${statusOf(row)}`)}
    </Badge>
  );
  const languages = (row: AdminPostRow) => (
    <span className="flex items-center gap-1">
      <Badge variant="outline" className="px-2 py-0.5">
        ID
      </Badge>
      {row.hasEnglish ? (
        <Badge variant="outline" className="px-2 py-0.5">
          EN
        </Badge>
      ) : (
        <Badge variant="neutral" className="px-2 py-0.5" title={t("englishMissing")}>
          <span aria-hidden>EN</span>
          <span className="sr-only">{t("englishMissing")}</span>
        </Badge>
      )}
    </span>
  );
  const thumbnail = (row: AdminPostRow, size: string) => (
    <span className={`relative shrink-0 overflow-hidden rounded-lg bg-muted ${size}`}>
      {row.cover ? (
        <Image src={row.cover.src} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon aria-hidden className="size-5" />
        </span>
      )}
    </span>
  );
  const updated = (row: AdminPostRow) => (
    <time
      dateTime={row.updatedAt.toISOString()}
      title={format.dateTime(row.updatedAt, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: adminTimeZone,
      })}
    >
      {format.relativeTime(row.updatedAt, now)}
    </time>
  );
  const actions = (row: AdminPostRow) => (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon-sm">
        <Link href={href(row)} aria-label={t("editLabel", { title: row.title })}>
          <PencilIcon aria-hidden />
        </Link>
      </Button>
      {canDelete && (
        <DeleteButton
          action={deletePostAction}
          input={{ id: row.id }}
          label={t("delete.rowLabel", { title: row.title })}
          title={t("delete.title", { title: row.title })}
          description={t("delete.body")}
          confirmLabel={t("delete.confirm")}
          successMessage={t("delete.deleted")}
        />
      )}
    </div>
  );

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="border-b border-border/60 text-caption font-semibold text-muted-foreground">
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.post")}
            </th>
            <th scope="col" className="hidden py-3 pr-4 font-semibold lg:table-cell">
              {t("columns.category")}
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.status")}
            </th>
            <th scope="col" className="hidden py-3 pr-4 font-semibold xl:table-cell">
              {t("columns.languages")}
            </th>
            <th scope="col" className="py-3 pr-4 text-right font-semibold">
              {t("columns.updated")}
            </th>
            <th scope="col" className="py-3">
              <span className="sr-only">{t("columns.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row) => (
            <tr key={row.id} className="align-middle">
              <th scope="row" className="py-3 pr-4 text-left font-normal">
                <Link
                  href={href(row)}
                  className="group flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {thumbnail(row, "h-12 w-18")}
                  <span className="line-clamp-2 text-body font-semibold text-foreground underline-offset-4 group-hover:text-primary group-hover:underline">
                    {row.title}
                  </span>
                </Link>
              </th>
              <td className="hidden py-3 pr-4 text-body-sm text-foreground lg:table-cell">
                {categoryLabels[row.category]}
              </td>
              <td className="py-3 pr-4">{status(row)}</td>
              <td className="hidden py-3 pr-4 xl:table-cell">{languages(row)}</td>
              <td className="py-3 pr-4 text-right text-body-sm whitespace-nowrap text-muted-foreground">
                {updated(row)}
              </td>
              <td className="py-3">{actions(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-border/60 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start gap-3 py-4">
            <Link
              href={href(row)}
              className="flex min-w-0 flex-1 items-start gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {thumbnail(row, "h-16 w-20")}
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="line-clamp-2 text-body font-semibold text-foreground">
                  {row.title}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                  {status(row)}
                  {categoryLabels[row.category]} · {updated(row)}
                </span>
              </span>
            </Link>
            {canDelete && (
              <DeleteButton
                action={deletePostAction}
                input={{ id: row.id }}
                label={t("delete.rowLabel", { title: row.title })}
                title={t("delete.title", { title: row.title })}
                description={t("delete.body")}
                confirmLabel={t("delete.confirm")}
                successMessage={t("delete.deleted")}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
