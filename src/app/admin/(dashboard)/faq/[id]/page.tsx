import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LastSaved } from "@/components/admin/last-saved";
import { DeleteButton } from "@/components/admin/row-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { deleteFaqItemAction } from "@/features/faq/actions";
import { getFaqItemForEdit } from "@/features/faq/admin-queries";
import { FaqForm } from "@/features/faq/components/faq-form";
import { faqListHref } from "@/features/faq/list-href";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminFaq" });
  return { title: t("editTitle") };
}

/** Edit one FAQ entry (Phase 4f). The id is read inside the boundary: it is request data. */
export default function EditFaqItemPage({ params }: PageProps<"/admin/faq/[id]">) {
  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditFaqItem params={params} />
    </Suspense>
  );
}

async function EditFaqItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Anything that is not a UUID cannot be an entry (and would fail the query).
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requirePermission("update", "faq", `${adminRoutes.faq}/${id}`);
  const [t, item] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminFaq" }),
    getFaqItemForEdit(user, id),
  ]);
  if (!item) notFound();
  const question = item.values.texts.id.question;

  return (
    <>
      <AdminPageHeader
        breadcrumbs={["faq"]}
        title={t("editTitle")}
        description={
          <>
            {t("editDescription")}{" "}
            <span className="text-caption">
              <LastSaved meta={{ updatedAt: item.updatedAt, updatedBy: null }} />
            </span>
          </>
        }
        actions={
          can(user, "delete", "faq") && (
            <DeleteButton
              action={deleteFaqItemAction}
              input={{ id }}
              // Shown as the button text: the page already says which question it is.
              label={t("deleteConfirm")}
              title={t("deleteTitle")}
              description={t("deleteBody", { name: question })}
              confirmLabel={t("deleteConfirm")}
              successMessage={t("deleted")}
              redirectTo={faqListHref(item.values.topic)}
              showLabel
            />
          )
        }
      />
      <FaqForm id={id} defaultValues={item.values} canPublish={can(user, "publish", "faq")} />
    </>
  );
}

function EditSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-[32rem] rounded-2xl" />
    </div>
  );
}
