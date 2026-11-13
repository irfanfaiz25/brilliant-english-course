import Image from "next/image";

import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Accessible name of the link, e.g. "Brilliant English Course, go to home". */
  label: string;
  className?: string;
  /** Load eagerly when the logo is part of the first paint (header). */
  priority?: boolean;
};

export function Logo({ label, className, priority = false }: LogoProps) {
  return (
    <Link href="/" aria-label={label} className={cn("inline-flex shrink-0 rounded-md", className)}>
      <Image
        src={siteConfig.logo.src}
        alt=""
        width={siteConfig.logo.width}
        height={siteConfig.logo.height}
        priority={priority}
        sizes="64px"
        className="h-full w-auto"
      />
    </Link>
  );
}
