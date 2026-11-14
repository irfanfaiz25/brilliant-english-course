import { describe, expect, it } from "vitest";

import { partnershipPackageDefaults } from "@/features/partners/defaults";
import { partnershipSettingSchema } from "@/features/partners/schema";

import {
  partnershipFieldName,
  toPartnershipFormErrors,
  toPartnershipFormValues,
  toPartnershipSetting,
} from "./partnership-form";

const values = toPartnershipFormValues(partnershipPackageDefaults);

describe("partnership form values", () => {
  it("round-trips the setting", () => {
    expect(values.investment).toBe("");
    expect(toPartnershipSetting(values)).toEqual(partnershipPackageDefaults);
  });

  it("applies one investment to every locale", () => {
    const setting = partnershipSettingSchema.parse(
      toPartnershipSetting({ ...values, investment: " 150000000 " }),
    );
    expect(setting.id.investment).toBe(150_000_000);
    expect(setting.en.investment).toBe(150_000_000);
  });

  it("rejects amounts with separators instead of guessing", () => {
    const result = partnershipSettingSchema.safeParse(
      toPartnershipSetting({ ...values, investment: "150.000.000" }),
    );
    expect(result.error?.issues[0]?.message).toBe("investmentInvalid");
  });
});

describe("partnership form errors", () => {
  it("maps setting paths to form fields", () => {
    expect(partnershipFieldName("en.investment")).toBe("investment");
    expect(partnershipFieldName("en.inclusions.2")).toBe("inclusions.en.2.value");
    expect(partnershipFieldName("id.inclusions")).toBe("inclusions.id.root");
  });

  it("nests issues for React Hook Form", () => {
    const tooFew = { ...values, inclusions: { ...values.inclusions, id: [{ value: "ab" }] } };
    const result = partnershipSettingSchema.safeParse(toPartnershipSetting(tooFew));
    expect(toPartnershipFormErrors(result.error?.issues ?? [])).toEqual({
      inclusions: {
        id: {
          0: { value: { type: "validate", message: "inclusionRequired" } },
          root: { type: "validate", message: "inclusionsTooFew" },
        },
      },
    });
  });
});
