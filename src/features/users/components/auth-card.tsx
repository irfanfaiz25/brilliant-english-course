import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

type AuthCardProps = {
  /** Area label above the title, e.g. "Admin BEC". */
  area: string;
  title: string;
  description?: ReactNode;
  /** Small link under the card back to the public site. */
  backLabel: string;
  children: ReactNode;
};

/** Centered card shared by the sign-in, forgot and reset password pages. */
export function AuthCard({ area, title, description, backLabel, children }: AuthCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <Image
          src={siteConfig.logo.src}
          alt={siteConfig.name}
          width={siteConfig.logo.width}
          height={siteConfig.logo.height}
          priority
          sizes="72px"
          className="h-16 w-auto"
        />
        <Card padding="lg" className="w-full gap-6">
          <header className="flex flex-col gap-2">
            <p className="text-overline text-primary uppercase">{area}</p>
            <h1 className="text-h3 text-foreground">{title}</h1>
            {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
          </header>
          {children}
        </Card>
        <Link
          href="/"
          className="rounded-sm text-body-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {backLabel}
        </Link>
      </div>
    </main>
  );
}
