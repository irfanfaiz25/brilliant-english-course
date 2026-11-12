import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

// Minimal localized 404. The illustrated version with search arrives with the site shell (Phase 2d).
export default async function NotFoundPage() {
  const t = await getTranslations("NotFound");

  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-start justify-center gap-4 px-5 py-16">
      <p className="text-overline text-partner">404</p>
      <h1 className="text-h1 text-foreground">{t("title")}</h1>
      <p className="text-body-lg text-muted-foreground">{t("description")}</p>
      <Link
        href="/"
        className="rounded-md bg-primary px-6 py-3 text-button text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary-hover"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
