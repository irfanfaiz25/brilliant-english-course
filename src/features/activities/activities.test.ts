import { describe, expect, it } from "vitest";

import { activityFixtures } from "@/db/seed/content/activities";
import { activitySchema } from "./schema";

describe("activities", () => {
  it("fixtures are valid and aligned across locales", () => {
    activityFixtures.id.forEach((a) => expect(() => activitySchema.parse(a)).not.toThrow());
    activityFixtures.en.forEach((a) => expect(() => activitySchema.parse(a)).not.toThrow());
    expect(activityFixtures.en.map((a) => a.slug)).toEqual(activityFixtures.id.map((a) => a.slug));
  });
});
