import type { CSSProperties } from "react";

import { UnitCard } from "@/features/units/components/unit-card";
import type { DirectoryUnit } from "@/features/units/directory";

/** Delay between cards rising in (CSS), capped so long lists don't drag. */
const CARD_STAGGER_MS = 60;
const MAX_STAGGERED_CARDS = 6;

/** Unit cards linking to their pages; optional distance chips (nearby units). */
export function UnitsGrid({
  units,
  distanceLabel,
}: {
  units: readonly DirectoryUnit[];
  distanceLabel?: (unit: DirectoryUnit) => string | undefined;
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {units.map((unit, index) => (
        <li
          key={unit.code}
          style={
            {
              animationDelay: `${Math.min(index, MAX_STAGGERED_CARDS) * CARD_STAGGER_MS}ms`,
            } as CSSProperties
          }
          className="animate-rise-in"
        >
          <UnitCard unit={unit} path={unit.path} distanceLabel={distanceLabel?.(unit)} />
        </li>
      ))}
    </ul>
  );
}
