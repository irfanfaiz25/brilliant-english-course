import "server-only";

import { getTranslations } from "next-intl/server";

import type { RegionFilterLabels, RegionLevelField } from "./components/region-filter";
import { getRegionChildren } from "./queries";
import { regionLevels, type Region } from "./schema";

/** Shared labels of the `RegionFilter` cascade (`Regions` messages). */
export async function getRegionFilterLabels(): Promise<RegionFilterLabels> {
  const t = await getTranslations("Regions");
  return { title: t("title"), all: t("all"), apply: t("apply"), reset: t("reset") };
}

/**
 * Builds the `RegionFilter` cascade for the selected region path: one field per level, whose
 * options are the children of the level above's selection.
 */
export async function buildRegionFields(path: readonly Region[]): Promise<RegionLevelField[]> {
  const t = await getTranslations("Regions");
  return Promise.all(
    regionLevels.map(async (level, index) => {
      const parent = index === 0 ? null : path[index - 1];
      const parentLevel = regionLevels[index - 1];
      const available = index === 0 || parent !== undefined;
      return {
        key: level,
        label: t(level),
        options: available ? await getRegionChildren(parent?.code ?? null) : [],
        value: path[index]?.code ?? null,
        parentCode: parent?.code ?? null,
        disabledHint:
          available || !parentLevel
            ? undefined
            : t("chooseParentFirst", { parent: t(parentLevel).toLowerCase() }),
      };
    }),
  );
}
