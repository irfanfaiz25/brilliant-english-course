import { ArrowLeftIcon, SearchXIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { adminLocale, adminRoutes } from "@/config/admin-routes";

/**
 * Not found inside the staff area: unknown admin URLs and modules the user may not open render
 * the same page, so it never reveals which modules exist (ADR-025).
 */
export default async function AdminNotFound() {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin.notFound" });
  return (
    <section className="mx-auto my-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl surface-glass-panel p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <SearchXIcon aria-hidden className="size-6" />
      </span>
      <h1 className="text-h3 text-foreground">{t("title")}</h1>
      <p className="text-body text-muted-foreground">{t("body")}</p>
      <Button asChild variant="secondary" size="sm">
        <Link href={adminRoutes.home}>
          <ArrowLeftIcon aria-hidden />
          {t("back")}
        </Link>
      </Button>
    </section>
  );
}
