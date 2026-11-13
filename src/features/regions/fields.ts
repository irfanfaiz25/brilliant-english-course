import "server-only";

import type { RegionLevelField } from "./components/region-filter";
import { getRegionChildren } from "./queries";
import type { Region } from "./schema";

export const REGION_LEVEL_KEYS = ["province", "regency", "district", "village"] as const;
export type RegionLevelKey = (typeof REGION_LEVEL_KEYS)[number];

type RegionFieldLabels = {
  /** Label per level, e.g. "Provinsi". */
  levels: Record<RegionLevelKey, string>;
  /** Placeholder for a level whose parent is not chosen yet. */
  chooseParentFirst: (parentLabel: string) => string;
};

/**
 * Builds the `RegionFilter` cascade for the selected region path: one field per level, whose
 * options are the children of the level above's selection.
 */
export async function buildRegionFields(
  path: readonly Region[],
  labels: RegionFieldLabels,
): Promise<RegionLevelField[]> {
  return Promise.all(
    REGION_LEVEL_KEYS.map(async (key, index) => {
      const parent = index === 0 ? null : path[index - 1];
      const available = index === 0 || parent !== undefined;
      const parentKey = REGION_LEVEL_KEYS[index - 1];
      return {
        key,
        label: labels.levels[key],
        options: available ? await getRegionChildren(parent?.code ?? null) : [],
        value: path[index]?.code ?? null,
        parentCode: parent?.code ?? null,
        disabledHint:
          available || !parentKey
            ? undefined
            : labels.chooseParentFirst(labels.levels[parentKey].toLowerCase()),
      };
    }),
  );
}
