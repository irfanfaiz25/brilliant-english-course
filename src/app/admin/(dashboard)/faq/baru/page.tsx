import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { firstParam } from "@/components/admin/list-href";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { FaqForm } from "@/features/faq/components/faq-form";
import { faqTopics, type FaqFormInput } from "@/features/faq/schema";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminFaq" });
  return { title: t("createTitle") };
}

/** Add an FAQ entry (Phase 4f); `?topic=` preselects the topic the list was showing. */
export default async function NewFaqItemPage({ searchParams }: PageProps<"/admin/faq/baru">) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminFaq" });
  return (
    <>
      <AdminPageHeader
        breadcrumbs={["faq"]}
        title={t("createTitle")}
        description={t("createDescription")}
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[32rem] rounded-2xl" />}>
        <NewFaqItem searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewFaqItem({
  searchParams,
}: {
  searchParams: PageProps<"/admin/faq/baru">["searchParams"];
}) {
  const user = await requirePermission("create", "faq", adminRoutes.newFaqItem);
  const requested = firstParam((await searchParams).topic);
  const emptyText = { question: "", answer: "" };
  const values: FaqFormInput = {
    topic: faqTopics.find((topic) => topic === requested) ?? "parents",
    isPublished: true,
    texts: { id: emptyText, en: emptyText },
  };
  return <FaqForm defaultValues={values} canPublish={can(user, "publish", "faq")} />;
}
