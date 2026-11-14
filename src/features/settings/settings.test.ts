import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { contactSettingsDefaults } from "./defaults";
import { contactSettingsSchema } from "./schema";
import { parseSetting } from "./service";

// `service.ts` also writes settings; the database is not needed for these pure checks.
vi.mock("@/db/client", () => ({ db: {} }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));

const schema = z.object({ email: z.email() });
const fallback = { email: "default@bec.test" };

describe("parseSetting", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the default when nothing is stored", () => {
    expect(parseSetting("contact", undefined, schema, fallback)).toBe(fallback);
    expect(parseSetting("contact", null, schema, fallback)).toBe(fallback);
  });

  it("returns a valid stored value", () => {
    expect(parseSetting("contact", { email: "halo@bec.id" }, schema, fallback)).toEqual({
      email: "halo@bec.id",
    });
  });

  it("falls back and warns when the stored value is invalid", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseSetting("contact", { email: "not-an-email" }, schema, fallback)).toBe(fallback);
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("contactSettingsSchema", () => {
  const errorsOf = (input: unknown) => {
    const result = contactSettingsSchema.safeParse(input);
    return result.success
      ? {}
      : Object.fromEntries(
          result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
        );
  };

  it("accepts the code defaults", () => {
    expect(contactSettingsSchema.safeParse(contactSettingsDefaults).success).toBe(true);
  });

  it("stores WhatsApp numbers in international form", () => {
    const parsed = contactSettingsSchema.parse({
      ...contactSettingsDefaults,
      whatsapp: "0812-3456-7890",
      email: " Halo@BEC.id ",
    });
    expect(parsed.whatsapp).toBe("6281234567890");
    expect(parsed.email).toBe("halo@bec.id");
  });

  it("rejects numbers that are not Indonesian mobiles", () => {
    expect(errorsOf({ ...contactSettingsDefaults, whatsapp: "021-555-1234" })).toEqual({
      whatsapp: "whatsappInvalid",
    });
  });

  it("checks office hours: closing after opening, each day once", () => {
    expect(
      errorsOf({
        ...contactSettingsDefaults,
        officeHours: [{ days: [1], opens: "17:00", closes: "08:00" }],
      }),
    ).toEqual({ "officeHours.0.closes": "closesBeforeOpens" });
    expect(
      errorsOf({
        ...contactSettingsDefaults,
        officeHours: [
          { days: [1, 2], opens: "08:00", closes: "17:00" },
          { days: [2], opens: "08:00", closes: "12:00" },
        ],
      }),
    ).toEqual({ officeHours: "daysOverlap" });
  });

  it("requires https social links", () => {
    expect(
      errorsOf({
        ...contactSettingsDefaults,
        social: { ...contactSettingsDefaults.social, tiktok: "http://tiktok.com/@bec" },
      }),
    ).toEqual({ "social.tiktok": "urlInvalid" });
  });
});
