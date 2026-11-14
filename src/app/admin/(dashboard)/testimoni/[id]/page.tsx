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
import { deleteTestimonialAction } from "@/features/testimonials/actions";
import { getTestimonialForEdit } from "@/features/testimonials/admin-queries";
import { TestimonialForm } from "@/features/testimonials/components/testimonial-form";
import { testimonialListHref } from "@/features/testimonials/list-href";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.testimonials") };
}

/** Edit one testimonial (Phase 4f). The id is read inside the boundary: it is request data. */
export default function EditTestimonialPage({ params }: PageProps<"/admin/testimoni/[id]">) {
  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditTestimonial params={params} />
    </Suspense>
  );
}

async function EditTestimonial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Anything that is not a UUID cannot be a testimonial (and would fail the query).
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requirePermission(
    "update",
    "testimonials",
    `${adminRoutes.testimonials}/${id}`,
  );
  const [t, testimonial] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminTestimonials" }),
    getTestimonialForEdit(user, id),
  ]);
  if (!testimonial) notFound();
  const { authorName: name, audience } = testimonial.values;

  return (
    <>
      <AdminPageHeader
        breadcrumbs={["testimonials"]}
        title={t("editTitle", { name })}
        description={
          <>
            {t("editDescription")}{" "}
            <span className="text-caption">
              <LastSaved meta={{ updatedAt: testimonial.updatedAt, updatedBy: null }} />
            </span>
          </>
        }
        actions={
          can(user, "delete", "testimonials") && (
            <DeleteButton
              action={deleteTestimonialAction}
              input={{ id }}
              label={t("deleteLabel", { name })}
              title={t("deleteTitle", { name })}
              description={t("deleteBody")}
              confirmLabel={t("deleteConfirm")}
              successMessage={t("deleted")}
              redirectTo={testimonialListHref(audience)}
              showLabel
            />
          )
        }
      />
      <TestimonialForm
        id={id}
        defaultValues={testimonial.values}
        canPublish={can(user, "publish", "testimonials")}
      />
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
