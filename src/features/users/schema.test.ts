import { describe, expect, it } from "vitest";

import { changePasswordSchema, userFormSchema } from "./schema";

const issues = (
  schema: {
    safeParse: (input: unknown) => {
      error?: { issues: { path: PropertyKey[]; message: string }[] };
    };
  },
  input: unknown,
) =>
  schema
    .safeParse(input)
    .error?.issues.map((issue) => `${issue.path.join(".")}=${issue.message}`) ?? [];

const unitId = "6f1c2c9e-8a5b-4d1e-9f3a-2b7c4d5e6f70";

describe("userFormSchema", () => {
  it("lowercases and trims the email so one address is one account", () => {
    const parsed = userFormSchema.parse({
      name: "  Ana  ",
      email: "  Ana@BEC.id ",
      role: "editor",
      unitId: "",
    });
    expect(parsed).toEqual({ name: "Ana", email: "ana@bec.id", role: "editor", unitId: null });
  });

  it("requires a unit for a partner account only", () => {
    expect(
      issues(userFormSchema, { name: "Mitra", email: "m@bec.id", role: "mitra", unitId: "" }),
    ).toEqual(["unitId=unitRequired"]);
    expect(
      userFormSchema.parse({ name: "Mitra", email: "m@bec.id", role: "mitra", unitId }).unitId,
    ).toBe(unitId);
  });

  it("drops a unit left over from switching a partner to a staff role", () => {
    expect(
      userFormSchema.parse({ name: "Ana", email: "a@bec.id", role: "admin", unitId }).unitId,
    ).toBeNull();
  });

  it("reports codes the form translates", () => {
    expect(
      issues(userFormSchema, { name: "A", email: "nope", role: "editor", unitId: "" }),
    ).toEqual(["name=tooShort:2", "email=emailInvalid"]);
    expect(
      issues(userFormSchema, { name: "Ana", email: "a@bec.id", role: "owner", unitId: "" }),
    ).toHaveLength(1);
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "old-password",
    password: "new-password-1",
    confirmPassword: "new-password-1",
  };

  it("needs the current password and a matching new one", () => {
    expect(issues(changePasswordSchema, valid)).toEqual([]);
    expect(issues(changePasswordSchema, { ...valid, currentPassword: "" })).toEqual([
      "currentPassword=passwordRequired",
    ]);
    expect(issues(changePasswordSchema, { ...valid, confirmPassword: "other-password" })).toEqual([
      "confirmPassword=passwordMismatch",
    ]);
    expect(
      issues(changePasswordSchema, { ...valid, password: "short", confirmPassword: "short" }),
    ).toEqual(["password=passwordTooShort"]);
  });
});
