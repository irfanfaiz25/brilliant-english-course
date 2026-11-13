import { getTranslations } from "next-intl/server";

import { CountUp } from "@/components/motion/count-up";
import type { NetworkStats } from "@/features/units/schema";

/** Network numbers on a card that overlaps the hero bottom edge (computed from data). */
export async function StatsSection({ stats }: { stats: NetworkStats }) {
  const t = await getTranslations("Home.stats");

  const items = [
    { value: stats.activeUnits, suffix: "+", label: t("activeUnits") },
    { value: stats.cities, suffix: "", label: t("cities") },
    { value: stats.students, suffix: "+", label: t("students") },
  ];

  return (
    <section aria-label={t("label")} className="relative z-10 -mt-14 px-5 md:-mt-16 md:px-8">
      <dl className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-border/70 rounded-2xl border border-border/60 bg-card py-5 shadow-card md:py-7">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 px-2 text-center">
            <dd className="order-first text-h3 text-primary md:text-h2">
              <CountUp value={item.value} suffix={item.suffix} />
            </dd>
            <dt className="text-caption text-muted-foreground md:text-body-sm">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
