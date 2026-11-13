import { getTranslations } from "next-intl/server";

import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import type { NetworkStats } from "@/features/units/schema";

/** Network numbers on a card that overlaps the hero bottom edge (computed from data). */
export async function StatsSection({ stats }: { stats: NetworkStats }) {
  const t = await getTranslations("Home.stats");

  // Labels break onto two balanced lines on phones (`<br>` hidden from `md`), so the three
  // columns always line up instead of one label wrapping on its own.
  const lineBreak = () => <br className="md:hidden" />;
  const items = [
    {
      key: "activeUnits",
      value: stats.activeUnits,
      suffix: "+",
      label: t.rich("activeUnits", { br: lineBreak }),
    },
    { key: "cities", value: stats.cities, suffix: "", label: t.rich("cities", { br: lineBreak }) },
    {
      key: "students",
      value: stats.students,
      suffix: "+",
      label: t.rich("students", { br: lineBreak }),
    },
  ];

  return (
    <section aria-label={t("label")} className="relative z-10 -mt-14 px-5 md:-mt-16 md:px-8">
      <Reveal>
        <dl className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-border/70 rounded-2xl border border-border/60 bg-card py-5 shadow-glow-primary md:py-7">
          {items.map((item) => (
            <div key={item.key} className="flex flex-col items-center gap-1 px-2 text-center">
              <dd className="order-first text-h3 text-primary md:text-h2">
                <CountUp value={item.value} suffix={item.suffix} hiddenOnLoad />
              </dd>
              <dt className="text-caption leading-snug text-muted-foreground md:text-body-sm">
                {item.label}
              </dt>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
