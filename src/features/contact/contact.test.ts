import { describe, expect, it } from "vitest";

import { contactSettingsDefaults } from "@/features/settings/defaults";
import { contactSettingsSchema } from "@/features/settings/schema";

import { contactMessageSchema } from "./schema";

const errorsOf = (input: unknown) => {
  const result = contactMessageSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe("contactMessageSchema", () => {
  it("accepts and trims a complete message", () => {
    expect(
      contactMessageSchema.parse({
        topic: "parent",
        name: " Rina ",
        message: " Jadwal kelas Kindy? ",
      }),
    ).toEqual({ topic: "parent", name: "Rina", message: "Jadwal kelas Kindy?" });
  });

  it("returns translatable codes", () => {
    expect(errorsOf({ topic: "", name: "R", message: "Halo" })).toEqual({
      topic: "topicRequired",
      name: "nameRequired",
      message: "messageTooShort",
    });
    expect(errorsOf({ topic: "other", name: "Rina", message: "a".repeat(501) })).toEqual({
      message: "messageTooLong",
    });
  });
});

describe("contact settings fixture", () => {
  it("is valid", () => {
    expect(contactSettingsSchema.parse(contactSettingsDefaults)).toEqual(contactSettingsDefaults);
  });
});
