import type { Level, LevelSlug } from "./schema";

/** The level whose age range contains `age`, if any. */
export function findLevelForAge(levels: readonly Level[], age: number): LevelSlug | undefined {
  return levels.find((level) => age >= level.ageMin && age <= level.ageMax)?.slug;
}
