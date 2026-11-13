import { ArrowRightIcon, HandshakeIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { DecorBlob } from "./decor-blob";
import { Section } from "./section";

type PartnerBannerProps = {
  title: string;
  text: string;
  cta: string;
  /** Defaults to the partnership page; pass a query to pre-select the visitor's region. */
  href?: ComponentProps<typeof Link>["href"];
};

/** Cross-journey nudge for visitors whose village has no unit yet (DESIGN.md § 5.1). */
export function PartnerBanner({ title, text, cta, href = "/kemitraan" }: PartnerBannerProps) {
  return (
    <Section spacing="compact" className="pb-20 md:pb-28">
      <Reveal>
        <div className="relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-3xl bg-gradient-teal-deep px-6 py-10 text-inverse-foreground shadow-lg sm:px-10 md:flex-row md:items-center md:justify-between">
          <DecorBlob
            tone="partner"
            className="parallax-soft -right-16 -bottom-24 size-80 opacity-70"
          />
          <div className="flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sunny-300 [&_svg]:size-6">
              <HandshakeIcon aria-hidden />
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-h3">{title}</h2>
              <p className="max-w-xl text-body text-inverse-muted">{text}</p>
            </div>
          </div>
          <Button asChild variant="partner" size="lg" pop className="shrink-0">
            <Link href={href}>
              {cta}
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}
