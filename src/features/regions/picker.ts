import "server-only";

import { getRegionChildren, getRegionPath } from "./queries";
import { regionLevels, type Region, type RegionLevel } from "./schema";

/** One select of the admin region picker, as first rendered. */
export type RegionPickerLevel = {
  level: RegionLevel;
  options: Region[];
  /** Selected code at this level, or "". */
  value: string;
};

/**
 * Initial state of the admin `RegionPicker` for a selected village (or nothing): the options of
 * every level down to the selection, so an edit form opens with the full path filled in.
 */
export async function getRegionPickerLevels(code: string | null): Promise<RegionPickerLevel[]> {
  const path = code ? await getRegionPath(code) : [];
  return Promise.all(
    regionLevels.map(async (level, index) => {
      const parent = index === 0 ? null : path[index - 1];
      const options = index === 0 || parent ? await getRegionChildren(parent?.code ?? null) : [];
      return { level, options, value: path[index]?.code ?? "" };
    }),
  );
}
