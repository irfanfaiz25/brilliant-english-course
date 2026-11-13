import { describe, expect, it } from "vitest";

import { partnershipPackageFixtures } from "./fixtures";
import { partnerApplicationSchema, partnershipPackageSchema } from "./schema";
import { createLeadReference } from "./service";

const valid = {
  fullName: "Rina Lestari",
  whatsapp: "0812-3456-7890",
  email: "",
  background: "parent",
  space: "ready",
  motivation: "",
  consent: true,
  villageCode: "32.01.05.2001",
};

const errorsOf = (input: unknown) => {
  const result = partnerApplicationSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
};

describe("partnerApplicationSchema", () => {
  it("accepts a complete application", () => {
    expect(partnerApplicationSchema.safeParse(valid).success).toBe(true);
  });

  it.each(["+62 812 3456 7890", "6281234567890", "81234567890"])("accepts phone %s", (whatsapp) => {
    expect(errorsOf({ ...valid, whatsapp })).toEqual({});
  });

  it("returns translatable codes for invalid fields", () => {
    expect(
      errorsOf({
        ...valid,
        fullName: " ",
        whatsapp: "0211234567",
        email: "nope",
        consent: false,
        villageCode: "32.01.05",
      }),
    ).toEqual({
      fullName: "nameRequired",
      whatsapp: "whatsappInvalid",
      email: "emailInvalid",
      consent: "consentRequired",
      villageCode: "villageRequired",
    });
  });

  it("limits the motivation length", () => {
    expect(errorsOf({ ...valid, motivation: "a".repeat(501) })).toEqual({
      motivation: "motivationTooLong",
    });
  });
});

describe("createLeadReference", () => {
  it("formats date and an unambiguous suffix", () => {
    expect(createLeadReference(new Date("2026-11-13T10:00:00Z"))).toMatch(
      /^MTR-261113-[A-HJ-NP-Z2-9]{4}$/,
    );
  });
});

describe("partnership package fixtures", () => {
  it("are valid and aligned across locales", () => {
    const { id, en } = partnershipPackageFixtures;
    expect(partnershipPackageSchema.parse(id)).toEqual(id);
    expect(partnershipPackageSchema.parse(en)).toEqual(en);
    expect(en.inclusions).toHaveLength(id.inclusions.length);
  });
});
