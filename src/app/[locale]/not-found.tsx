import { ArrowLeftIcon, MapPinIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { DecorBlob } from "@/components/site/decor-blob";
import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/navigation";
import { Link } from "@/i18n/navigation";

/** Localized 404 inside the full site frame, with ways back into the main journeys. */
export default async function NotFoundPage() {
  const t = await getTranslations("NotFound");
  const tNav = await getTranslations("Nav");

  return (
    <SiteShell>
      <section className="relative isolate flex flex-1 items-center overflow-hidden bg-gradient-soft">
        <DecorBlob tone="primary" className="-top-16 -left-20 size-80" />
        <DecorBlob tone="highlight" className="right-0 bottom-0 size-72" />
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)] opacity-60"
        />

        <div className="mx-auto flex w-full max-w-page flex-col items-center gap-6 px-5 py-24 text-center md:px-8">
          <p aria-hidden className="text-gradient-brand text-jumbo">
            404
          </p>
          <h1 className="text-h1 text-foreground">{t("title")}</h1>
          <p className="max-w-prose text-body-lg text-muted-foreground">{t("description")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild pop>
              <Link href="/">
                <ArrowLeftIcon aria-hidden />
                {t("backHome")}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/cek-unit">
                <MapPinIcon aria-hidden />
                {t("findUnit")}
              </Link>
            </Button>
          </div>
          <nav
            aria-labelledby="not-found-popular"
            className="flex flex-col items-center gap-3 pt-6"
          >
            <h2 id="not-found-popular" className="text-overline text-muted-foreground uppercase">
              {t("popular")}
            </h2>
            <ul className="flex flex-wrap justify-center gap-2">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-body-sm text-muted-foreground shadow-sm transition-[color,border-color,transform] duration-(--duration-fast) hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                  >
                    {tNav(item.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </SiteShell>
  );
}
