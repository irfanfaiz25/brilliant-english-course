import { describe, expect, it } from "vitest";

import { userRoles, type UserRole } from "@/features/users/schema";

import {
  assertCan,
  can,
  canAccessAdmin,
  permissionActions,
  PermissionError,
  resources,
  type Actor,
  type PermissionAction,
  type Resource,
} from "./permissions";

/**
 * The expected matrix, written out by hand so a change to `permissions.ts` must be mirrored here
 * on purpose. Letters: r = read, c = create, u = update, d = delete, p = publish.
 * Mitra entries apply to records of its own unit only (checked separately below).
 */
const expected: Record<UserRole, Partial<Record<Resource, string>>> = {
  super_admin: Object.fromEntries(resources.map((resource) => [resource, "rcudp"])),
  admin: {
    dashboard: "r",
    units: "rcud",
    quota: "rcud",
    leads: "rcud",
    programs: "rcudp",
    activities: "rcudp",
    blog: "rcudp",
    testimonials: "rcudp",
    faq: "rcudp",
    media: "rcud",
    settings: "ru",
    seo: "ru",
    users: "r",
    auditLog: "r",
  },
  editor: {
    dashboard: "r",
    programs: "rcudp",
    activities: "rcudp",
    blog: "rcudp",
    testimonials: "rcudp",
    faq: "rcudp",
    media: "rcud",
    seo: "ru",
  },
  mitra: { units: "ru" },
};

const letter: Record<PermissionAction, string> = {
  read: "r",
  create: "c",
  update: "u",
  delete: "d",
  publish: "p",
};

const OWN_UNIT = "0193a1b2-0000-7000-8000-000000000001";
const OTHER_UNIT = "0193a1b2-0000-7000-8000-000000000002";

function actorFor(role: UserRole): NonNullable<Actor> {
  return { role, unitId: role === "mitra" ? OWN_UNIT : null, isActive: true };
}

describe("permission matrix", () => {
  for (const role of userRoles) {
    describe(role, () => {
      for (const resource of resources) {
        for (const action of permissionActions) {
          const allowed = expected[role][resource]?.includes(letter[action]) ?? false;
          it(`${allowed ? "may" : "may not"} ${action} ${resource}`, () => {
            // Staff are checked on the bare resource, mitra on a record of its own unit.
            const target = role === "mitra" ? { resource, unitId: OWN_UNIT } : resource;
            expect(can(actorFor(role), action, target)).toBe(allowed);
          });
        }
      }
    });
  }
});

describe("unit scoping", () => {
  const mitra = actorFor("mitra");

  it("lets a mitra act only on its own unit", () => {
    expect(can(mitra, "update", { resource: "units", unitId: OWN_UNIT })).toBe(true);
    expect(can(mitra, "update", { resource: "units", unitId: OTHER_UNIT })).toBe(false);
    expect(can(mitra, "read", { resource: "units", unitId: null })).toBe(false);
  });

  it("denies a mitra the bare resource (no listing every unit)", () => {
    expect(can(mitra, "read", "units")).toBe(false);
  });

  it("denies a mitra without a unit", () => {
    const orphan = { ...mitra, unitId: null };
    expect(can(orphan, "read", { resource: "units", unitId: OWN_UNIT })).toBe(false);
    expect(can(orphan, "read", { resource: "units", unitId: null })).toBe(false);
  });

  it("does not limit staff to a unit", () => {
    expect(can(actorFor("admin"), "update", { resource: "units", unitId: OTHER_UNIT })).toBe(true);
  });
});

describe("actors without access", () => {
  it("deny signed-out visitors everything", () => {
    for (const resource of resources) {
      for (const action of permissionActions) expect(can(null, action, resource)).toBe(false);
    }
  });

  it("deny deactivated accounts everything, even a super admin", () => {
    const disabled = { role: "super_admin", unitId: null, isActive: false } as const;
    for (const resource of resources) {
      for (const action of permissionActions) expect(can(disabled, action, resource)).toBe(false);
    }
  });
});

describe("canAccessAdmin", () => {
  it("admits staff but not mitra or visitors", () => {
    expect(canAccessAdmin(actorFor("super_admin"))).toBe(true);
    expect(canAccessAdmin(actorFor("admin"))).toBe(true);
    expect(canAccessAdmin(actorFor("editor"))).toBe(true);
    expect(canAccessAdmin(actorFor("mitra"))).toBe(false);
    expect(canAccessAdmin(null)).toBe(false);
  });
});

describe("special rules", () => {
  it("keeps noindex and user management with the super admin (ADR-008)", () => {
    for (const role of ["admin", "editor", "mitra"] as const) {
      expect(can(actorFor(role), "update", "seoIndexing")).toBe(false);
      expect(can(actorFor(role), "create", "users")).toBe(false);
      expect(can(actorFor(role), "update", "users")).toBe(false);
    }
    expect(can(actorFor("super_admin"), "update", "seoIndexing")).toBe(true);
    expect(can(actorFor("super_admin"), "create", "users")).toBe(true);
  });

  it("keeps editors away from partner data and settings", () => {
    const editor = actorFor("editor");
    for (const resource of ["units", "quota", "leads", "settings", "users", "auditLog"] as const) {
      expect(can(editor, "read", resource)).toBe(false);
    }
  });
});

describe("assertCan", () => {
  it("passes silently when allowed and throws a PermissionError otherwise", () => {
    expect(() => assertCan(actorFor("admin"), "read", "leads")).not.toThrow();
    expect(() => assertCan(actorFor("editor"), "read", "leads")).toThrow(PermissionError);
    expect(() => assertCan(null, "read", "dashboard")).toThrow(/read dashboard/);
  });
});
