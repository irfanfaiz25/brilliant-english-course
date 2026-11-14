import type { UserRole } from "@/features/users/schema";

/**
 * The one place that decides who may do what (AGENTS.md § 4, ADR-006, ADR-025). Every Server
 * Action, Route Handler and admin page asks `can()` on the server; hiding UI is not authorization.
 *
 * Model: a fixed matrix of role → resource → actions, plus unit scoping for `mitra`. A resource
 * passed as `{ resource, unitId }` describes a record that belongs to a unit; a mitra may only act
 * on records of its own unit. Anything not listed is denied.
 */

export const resources = [
  /** The admin area itself (overview page, navigation). */
  "dashboard",
  "units",
  "quota",
  "leads",
  "programs",
  "activities",
  "blog",
  "testimonials",
  "faq",
  "media",
  "settings",
  "seo",
  /** `noindex` on any page: super admin only (ADR-008). */
  "seoIndexing",
  "users",
  "auditLog",
] as const;
export type Resource = (typeof resources)[number];

export const permissionActions = ["read", "create", "update", "delete", "publish"] as const;
export type PermissionAction = (typeof permissionActions)[number];

/** A record that belongs to a unit, for unit-scoped checks. */
export type ScopedResource = { resource: Resource; unitId: string | null };

/** Who is asking. `null` = signed out. Inactive accounts are denied everything. */
export type Actor = { role: UserRole; unitId: string | null; isActive?: boolean } | null;

const ALL = permissionActions;
const READ_WRITE = ["read", "create", "update", "delete"] as const;
const CONTENT = ["read", "create", "update", "delete", "publish"] as const;

export type Grants = Partial<Record<Resource, readonly PermissionAction[]>>;

/** Global grants per role. `mitra` grants apply only to records of its own unit (see below). */
const grants: Record<UserRole, Grants> = {
  super_admin: Object.fromEntries(resources.map((resource) => [resource, ALL])),
  admin: {
    dashboard: ["read"],
    units: READ_WRITE,
    quota: READ_WRITE,
    leads: READ_WRITE,
    programs: CONTENT,
    activities: CONTENT,
    blog: CONTENT,
    testimonials: CONTENT,
    faq: CONTENT,
    media: READ_WRITE,
    settings: ["read", "update"],
    seo: ["read", "update"],
    users: ["read"],
    auditLog: ["read"],
  },
  editor: {
    dashboard: ["read"],
    programs: CONTENT,
    activities: CONTENT,
    blog: CONTENT,
    testimonials: CONTENT,
    faq: CONTENT,
    media: READ_WRITE,
    seo: ["read", "update"],
  },
  // The partner portal ships later (Phase 9); until then a mitra can only see and edit its unit.
  mitra: {
    units: ["read", "update"],
  },
};

/** Roles whose grants hold only inside their own unit. */
const unitScopedRoles: ReadonlySet<UserRole> = new Set(["mitra"]);

/** What `role` may do per resource, for the read-only matrix in the Users module. */
export function grantsFor(role: UserRole): Grants {
  return grants[role];
}

/** Whether `role`'s grants hold only inside its own unit (`mitra`). */
export function isUnitScoped(role: UserRole): boolean {
  return unitScopedRoles.has(role);
}

export function can(
  actor: Actor,
  action: PermissionAction,
  target: Resource | ScopedResource,
): boolean {
  if (!actor || actor.isActive === false) return false;
  const { resource, unitId } =
    typeof target === "string" ? { resource: target, unitId: undefined } : target;

  if (!grants[actor.role][resource]?.includes(action)) return false;
  if (!unitScopedRoles.has(actor.role)) return true;

  // Unit-scoped roles need a concrete record of their own unit; a bare resource (e.g. "list all
  // units") or a record of another unit is denied.
  return actor.unitId !== null && unitId !== undefined && unitId === actor.unitId;
}

/** Thrown by `assertCan`; data access functions use it so a missing check can never leak data. */
export class PermissionError extends Error {
  constructor(action: PermissionAction, resource: Resource) {
    super(`Not allowed to ${action} ${resource}`);
    this.name = "PermissionError";
  }
}

/** `can()` for data access layers: throws instead of returning `false`. */
export function assertCan(
  actor: Actor,
  action: PermissionAction,
  target: Resource | ScopedResource,
): void {
  if (!can(actor, action, target)) {
    throw new PermissionError(action, typeof target === "string" ? target : target.resource);
  }
}

/** Whether the role may enter the staff dashboard at all. */
export function canAccessAdmin(actor: Actor): boolean {
  return can(actor, "read", "dashboard");
}
