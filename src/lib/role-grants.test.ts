import { describe, expect, it } from "vitest";

import {
  can,
  configurableResources,
  defaultGrantsFor,
  effectiveGrants,
  grantableActions,
  normalizeActions,
  normalizeRoleGrants,
  toggleAction,
  type Actor,
  type Grants,
} from "./permissions";

/*
 * Configurable permissions (ADR-036): the safety rules that hold whatever a super admin ticks or
 * whatever ends up stored.
 */

const actor = (role: NonNullable<Actor>["role"], grants?: Grants): Actor => ({
  role,
  unitId: role === "mitra" ? "unit-1" : null,
  grants,
});

describe("can with configured grants", () => {
  it("follows the configured grants of admin and editor", () => {
    const editor = actor("editor", effectiveGrants("editor", { editor: { leads: ["read"] } }));
    expect(can(editor, "read", "leads")).toBe(true);
    expect(can(editor, "update", "leads")).toBe(false);
    // Not ticked any more: denied even though the default allowed it.
    expect(can(editor, "read", "blog")).toBe(false);
  });

  it("ignores grants for super admins and partners", () => {
    expect(can(actor("super_admin", {}), "update", "users")).toBe(true);
    const mitra = actor("mitra", { leads: ["read"], units: [] });
    expect(can(mitra, "read", "leads")).toBe(false);
    expect(can(mitra, "update", { resource: "units", unitId: "unit-1" })).toBe(true);
  });
});

describe("normalizeActions", () => {
  it("adds read when anything else is granted", () => {
    expect(normalizeActions("blog", ["publish", "update"])).toEqual(["read", "update", "publish"]);
  });

  it("drops actions a module does not have and repeats", () => {
    expect(normalizeActions("leads", ["create", "read", "read"])).toEqual(["read"]);
    expect(normalizeActions("programs", ["delete"])).toEqual([]);
  });

  it("keeps account management with super admins", () => {
    expect(grantableActions("users")).toEqual(["read"]);
    expect(normalizeActions("users", ["update", "create"])).toEqual([]);
    expect(normalizeActions("users", ["read", "update"])).toEqual(["read"]);
  });

  it("does not invent read for a module without it", () => {
    expect(normalizeActions("seoIndexing", ["update"])).toEqual(["update"]);
  });
});

describe("normalizeRoleGrants", () => {
  it("keeps the fixed resources at their defaults", () => {
    const grants = normalizeRoleGrants("admin", { dashboard: [], auditLog: [] });
    expect(grants.dashboard).toEqual(["read"]);
    expect(grants.auditLog).toEqual(["read"]);
    expect(normalizeRoleGrants("editor", {}).dashboard).toEqual(["read"]);
  });

  it("leaves the code defaults unchanged, so an untouched save changes nothing", () => {
    for (const role of ["admin", "editor"] as const) {
      expect(normalizeRoleGrants(role, defaultGrantsFor(role))).toEqual(defaultGrantsFor(role));
    }
  });

  it("does not list the fixed resources as configurable", () => {
    expect(configurableResources).not.toContain("dashboard");
    expect(configurableResources).not.toContain("auditLog");
    expect(configurableResources).toContain("users");
  });
});

describe("effectiveGrants", () => {
  it("uses the defaults until something is saved", () => {
    expect(effectiveGrants("editor")).toBe(defaultGrantsFor("editor"));
    expect(effectiveGrants("admin", {})).toBe(defaultGrantsFor("admin"));
  });

  it("never applies stored grants to super admins or partners", () => {
    const stored = { admin: { users: ["read" as const] }, editor: {} };
    expect(effectiveGrants("super_admin", stored)).toBe(defaultGrantsFor("super_admin"));
    expect(effectiveGrants("mitra", stored)).toBe(defaultGrantsFor("mitra"));
  });
});

describe("toggleAction", () => {
  it("brings read along when another action is ticked", () => {
    expect(toggleAction("faq", [], "delete", true)).toEqual(["read", "delete"]);
  });

  it("clears the row when read is cleared, and only the action otherwise", () => {
    expect(toggleAction("faq", ["read", "update", "publish"], "read", false)).toEqual([]);
    expect(toggleAction("faq", ["read", "update", "publish"], "update", false)).toEqual([
      "read",
      "publish",
    ]);
  });

  it("cannot tick an action the module does not have", () => {
    expect(toggleAction("users", ["read"], "update", true)).toEqual(["read"]);
  });
});
