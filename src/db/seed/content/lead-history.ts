import type { LeadStatus, PartnerBackground, PartnerSpace } from "@/features/partners/schema";

import { sampleLeads } from "./leads";
import { unitFixtures } from "./units";

/*
 * PLACEHOLDER: a year of partner applications so Ringkasan's trend, pipeline and region charts
 * have something to show in development and CI (Phase 4h). Deterministic (same output on every
 * run), fictional people, real villages from the other sample content. Nothing is newer than two
 * weeks, so the "last 7 days" numbers and the latest-leads list keep showing `sampleLeads`.
 */

export type HistoryLead = {
  fullName: string;
  whatsapp: string;
  background: PartnerBackground;
  space: PartnerSpace;
  villageCode: string;
  status: LeadStatus;
  daysAgo: number;
  /** Became the partner of `unitFixtures[unitIndex]`, `convertedDaysAgo` days ago. */
  conversion?: { unitIndex: number; convertedDaysAgo: number };
};

const firstNames = [
  "Ayu",
  "Bima",
  "Citra",
  "Dewi",
  "Eko",
  "Fajar",
  "Gita",
  "Hana",
  "Indra",
  "Joko",
  "Kartika",
  "Lestari",
  "Maya",
  "Nanda",
  "Oki",
  "Putri",
  "Rizki",
  "Sari",
  "Teguh",
  "Wulan",
];
const lastNames = [
  "Pratama",
  "Santoso",
  "Wijaya",
  "Lestari",
  "Hidayat",
  "Saputra",
  "Rahmawati",
  "Kurniawan",
  "Permata",
  "Nugroho",
];
const backgrounds: PartnerBackground[] = ["educator", "entrepreneur", "parent", "other"];
const spaces: PartnerSpace[] = ["ready", "preparing", "notYet"];

/** Small seeded PRNG (mulberry32), so the history is the same on every run. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Days ago each sample unit opened (`seed.ts` opens unit `i` (i + 1) × 30 days ago). */
export const unitOpenedDaysAgo = (unitIndex: number) => (unitIndex + 1) * 30;

export function leadHistory(): HistoryLead[] {
  const next = random(2026);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T;
  const villages = [
    ...new Set([
      ...unitFixtures.map((unit) => unit.villageCode),
      ...sampleLeads.map((lead) => lead.villageCode),
    ]),
  ];
  const leads: HistoryLead[] = [];
  const person = () => ({
    fullName: `${pick(firstNames)} ${pick(lastNames)}`,
    whatsapp: `6281299${String(leads.length + 1).padStart(5, "0")}`,
    background: pick(backgrounds),
    space: pick(spaces),
  });

  // The partners behind the sample units: they applied 3 to 5 weeks before their unit opened.
  unitFixtures.forEach((unit, unitIndex) => {
    const convertedDaysAgo = unitOpenedDaysAgo(unitIndex);
    leads.push({
      ...person(),
      villageCode: unit.villageCode,
      status: "converted",
      daysAgo: convertedDaysAgo + 21 + Math.floor(next() * 15),
      conversion: { unitIndex, convertedDaysAgo },
    });
  });

  // Everyone else: more applications in recent months, older ones closed, recent ones open.
  for (let daysAgo = 364; daysAgo >= 14; daysAgo -= 1) {
    if (next() > 0.05 + 0.12 * (1 - daysAgo / 365)) continue;
    const closed = daysAgo > 60;
    leads.push({
      ...person(),
      villageCode: pick(villages),
      status: closed
        ? pick<LeadStatus>(["rejected", "lost", "lost"])
        : pick<LeadStatus>(["contacted", "qualified"]),
      daysAgo,
    });
  }
  return leads.sort((a, b) => b.daysAgo - a.daysAgo);
}
