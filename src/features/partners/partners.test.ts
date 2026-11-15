import { describe, expect, it } from "vitest";

import { partnershipPageDefaults } from "./page-defaults";
import {
  partnershipBenefitsSchema,
  partnershipKitFormSchema,
  partnershipKitSchema,
  partnershipStepsSchema,
  partnershipTrainingSchema,
  toInvestment,
} from "./page-schema";
import { partnerApplicationSchema } from "./schema";
import { createLeadReference } from "./reference";

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

describe("Kemitraan page defaults", () => {
  it("are valid settings with copy in both locales", () => {
    const { benefits, kit, training, steps } = partnershipPageDefaults;
    expect(partnershipBenefitsSchema.parse(benefits)).toEqual(benefits);
    expect(partnershipKitSchema.parse(kit)).toEqual(kit);
    expect(partnershipTrainingSchema.parse(training)).toEqual(training);
    expect(partnershipStepsSchema.parse(steps)).toEqual(steps);
  });

  it("lead the hero with at least one featured benefit", () => {
    expect(partnershipPageDefaults.benefits.items.some((item) => item.featured)).toBe(true);
  });
});

describe("Kemitraan page forms", () => {
  const kit = partnershipPageDefaults.kit;

  it("turns the typed investment into a number, or null when empty", () => {
    expect(toInvestment("")).toBeNull();
    expect(toInvestment(" 7500000 ")).toBe(7500000);
  });

  it("accepts digits only for the investment", () => {
    const form = (investment: string) =>
      partnershipKitFormSchema.safeParse({ ...kit, investment }).success;
    expect(form("7500000")).toBe(true);
    expect(form("")).toBe(true);
    expect(form("7.500.000")).toBe(false);
  });

  it("needs copy in both locales and keeps lists within their limits", () => {
    const [first] = partnershipPageDefaults.benefits.items;
    if (!first) throw new Error("Missing benefit");
    const noEnglish = { ...first, texts: { ...first.texts, en: { title: "", text: "" } } };
    const result = partnershipBenefitsSchema.safeParse({
      items: [noEnglish, ...partnershipPageDefaults.benefits.items.slice(1)],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["items", 0, "texts", "en", "title"]);
    expect(partnershipStepsSchema.safeParse({ items: [] }).success).toBe(false);
  });
});
