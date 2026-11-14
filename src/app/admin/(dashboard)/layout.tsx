import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { SkipLink } from "@/components/site/skip-link";
import { DecorBlob } from "@/components/site/decor-blob";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { siteConfig } from "@/config/site";

import { MobileNav, NavSkeleton, SidebarNav, UserMenu } from "./_shell/shell-parts";

const CONTENT_ID = "konten-admin";

/**
 * Admin shell (DESIGN.md § 6): a frosted sidebar (icon rail at `lg`, labelled from `xl`, sheet
 * below `lg`), a sticky frosted top bar and content up to 1280 px over a soft brand gradient.
 * Session-dependent parts stream inside their own boundaries; the layout itself never awaits
 * the session, and every page checks access next to its data.
 */
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  const logo = (
    <Image
      src={siteConfig.logo.src}
      alt={siteConfig.name}
      width={siteConfig.logo.width}
      height={siteConfig.logo.height}
      priority
      sizes="48px"
      className="h-10 w-auto"
    />
  );

  return (
    <div className="relative isolate flex min-h-dvh flex-1 bg-gradient-soft">
      <SkipLink targetId={CONTENT_ID} label={t("skipToContent")} />
      {/* Colour fields behind the glass panels; fixed so they stay put while content scrolls. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <DecorBlob tone="primary" className="-top-32 -left-24 size-[28rem]" />
        <DecorBlob tone="highlight" className="top-1/3 -right-32 size-[26rem]" />
        <DecorBlob tone="partner" className="-bottom-40 left-1/3 size-[22rem] opacity-60" />
      </div>

      <aside className="fixed inset-y-3 left-3 z-(--z-sticky) hidden w-20 flex-col gap-6 overflow-y-auto rounded-2xl surface-glass-panel p-3 lg:flex xl:w-64 xl:p-4">
        <Link
          href={adminRoutes.home}
          className="flex items-center justify-center gap-3 rounded-lg px-1 py-1 xl:justify-start"
        >
          {logo}
          <span className="hidden text-label text-foreground xl:inline">{t("area")}</span>
        </Link>
        <Suspense fallback={<NavSkeleton />}>
          <SidebarNav />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-26 xl:pl-70">
        <header className="sticky top-0 z-(--z-header) px-3 pt-3">
          <div className="flex h-16 items-center gap-2 rounded-2xl surface-glass-panel px-3">
            <Suspense fallback={<Skeleton className="size-11 rounded-md lg:hidden" />}>
              <MobileNav />
            </Suspense>
            <Link href={adminRoutes.home} className="rounded-md lg:hidden">
              {logo}
            </Link>
            <div className="flex-1" />
            <Suspense fallback={<Skeleton className="h-11 w-11 rounded-full sm:w-40" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>

        <main
          id={CONTENT_ID}
          tabIndex={-1}
          className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
