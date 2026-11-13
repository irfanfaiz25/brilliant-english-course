import {
  ClipboardCheckIcon,
  MessagesSquareIcon,
  TrendingUpIcon,
  UsersRoundIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { cn } from "@/lib/utils";

/** "Why BEC": four benefits as cards with tinted icons and a staggered reveal. */
export async function WhySection() {
  const t = await getTranslations("Program.why");
  const items = [
    {
      icon: MessagesSquareIcon,
      title: t("conversationTitle"),
      text: t("conversationText"),
      tone: "bg-level-intro-soft text-level-intro-strong",
    },
    {
      icon: TrendingUpIcon,
      title: t("grammarTitle"),
      text: t("grammarText"),
      tone: "bg-level-secondary-soft text-level-secondary-strong",
    },
    {
      icon: UsersRoundIcon,
      title: t("classTitle"),
      text: t("classText"),
      tone: "bg-level-kindy-soft text-level-kindy-strong",
    },
    {
      icon: ClipboardCheckIcon,
      title: t("reportTitle"),
      text: t("reportText"),
      tone: "bg-success-soft text-success-strong",
    },
  ];

  return (
    <Section aria-labelledby="why-title">
      <span
        aria-hidden
        className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)] bg-gradient-warm"
      />
      <Doodle
        shape="plus"
        tone="partner"
        className="top-20 right-[10%] hidden size-7 animate-float md:block"
      />

      <SectionHeader
        id="why-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
        align="center"
      />

      <Stagger as="ul" className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text, tone }) => (
          <StaggerItem
            key={title}
            as="li"
            className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-[transform,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg"
          >
            <span
              className={cn(
                "inline-flex size-12 items-center justify-center rounded-xl transition-transform duration-(--duration-base) ease-out group-hover:scale-110 group-hover:-rotate-6 [&_svg]:size-6",
                tone,
              )}
            >
              <Icon aria-hidden />
            </span>
            <h3 className="text-h5 text-foreground">{title}</h3>
            <p className="text-body-sm text-muted-foreground">{text}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
