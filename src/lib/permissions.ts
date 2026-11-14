import type { UserRole } from "@/features/users/schema";

/**
 * The one place that decides who may do what (AGENTS.md § 4, ADR-006, ADR-025). Every Server
 * Action, Route Handler and admin page asks `can()` on the server; hiding UI is not authorization.
 *
 * Model: a matrix of role → resource → actions, plus unit scoping for `mitra`. A resource passed
 * as `{ resource, unitId }` describes a record that belongs to a unit; a mitra may only act on
 * records of its own unit. Anything not listed is denied.
 *
 * The matrix below is the default. Super admins may change what `admin` and `editor` may do in
 * Pengguna › Hak akses (ADR-036); the session attaches that role's effective grants to the actor
 * (`Actor.grants`). Super admin and mitra always use the code matrix, and every configured matrix
 * passes `normalizeRoleGrants()`, so the safety rules below hold whatever is stored.
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

export type Grants = Partial<Record<Resource, readonly PermissionAction[]>>;

/**
 * Who is asking. `null` = signed out. Inactive accounts are denied everything. `grants` are the
 * role's configured grants (from the session); without them the defaults apply.
 */
export type Actor = {
  role: UserRole;
  unitId: string | null;
  isActive?: boolean;
  grants?: Grants;
} | null;

const ALL = permissionActions;
const READ_WRITE = ["read", "create", "update", "delete"] as const;
const CONTENT = ["read", "create", "update", "delete", "publish"] as const;

/** Default grants per role. `mitra` grants apply only to records of its own unit (see below). */
const defaultGrants: Record<UserRole, Grants> = {
  super_admin: Object.fromEntries(resources.map((resource) => [resource, ALL])),
  admin: {
    dashboard: ["read"],
    units: READ_WRITE,
    quota: READ_WRITE,
    leads: ["read", "update", "delete"],
    programs: ["read", "update", "publish"],
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
    programs: ["read", "update", "publish"],
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

/** The code default of `role` (the matrix above). */
export function defaultGrantsFor(role: UserRole): Grants {
  return defaultGrants[role];
}

/*
 * Configurable matrix (ADR-036). Only these roles can be changed; super admin keeps everything
 * (nobody can lock the team out of account management) and mitra stays unit-scoped until the
 * partner portal (Phase 9), because unit scoping exists only for units.
 */

export const configurableRoles = ["admin", "editor"] as const;
export type ConfigurableRole = (typeof configurableRoles)[number];
export type RoleGrants = Record<ConfigurableRole, Grants>;

export const isConfigurableRole = (role: UserRole): role is ConfigurableRole =>
  (configurableRoles as readonly UserRole[]).includes(role);

/** The actions each resource actually has (what the app checks); nothing else can be granted. */
export const resourceActions = {
  dashboard: ["read"],
  units: ["read", "create", "update", "delete"],
  quota: ["read", "create", "update", "delete"],
  leads: ["read", "update", "delete"],
  programs: ["read", "update", "publish"],
  activities: CONTENT,
  blog: CONTENT,
  testimonials: CONTENT,
  faq: CONTENT,
  media: ["read", "create", "update", "delete"],
  settings: ["read", "update"],
  seo: ["read", "update"],
  seoIndexing: ["update"],
  users: ["read", "create", "update"],
  auditLog: ["read"],
} as const satisfies Record<Resource, readonly PermissionAction[]>;

/**
 * Resources whose grants stay at the default for every staff role: the overview also guards
 * shared admin tools (region search), and the audit log has no module yet.
 */
const fixedResources: ReadonlySet<Resource> = new Set(["dashboard", "auditLog"]);

/** Resources a super admin can tick for `admin` / `editor`, in display order. */
export const configurableResources: readonly Resource[] = resources.filter(
  (resource) => !fixedResources.has(resource),
);

/**
 * What may be granted on `resource`: its actions, except that account management stays with
 * super admins (granting "edit users" would let a role make itself super admin): `users` → read.
 */
export function grantableActions(resource: Resource): readonly PermissionAction[] {
  if (resource === "users") return ["read"];
  return resourceActions[resource];
}

/**
 * `actions` as stored for `resource`: only grantable actions, each once, in matrix order, and with
 * "read" whenever anything else is granted (editing what you cannot see makes no sense).
 */
export function normalizeActions(
  resource: Resource,
  actions: readonly string[],
): PermissionAction[] {
  const grantable = grantableActions(resource);
  const kept = permissionActions.filter(
    (action) => grantable.includes(action) && actions.includes(action),
  );
  const needsRead = kept.some((action) => action !== "read") && grantable.includes("read");
  return needsRead && !kept.includes("read") ? ["read", ...kept] : kept;
}

/** A configurable role's grants made safe: configurable resources normalized, fixed ones default. */
export function normalizeRoleGrants(role: ConfigurableRole, configured: Grants): Grants {
  return Object.fromEntries(
    resources.flatMap((resource) => {
      const actions = fixedResources.has(resource)
        ? (defaultGrants[role][resource] ?? [])
        : normalizeActions(resource, configured[resource] ?? []);
      return actions.length ? [[resource, actions]] : [];
    }),
  );
}

/** The grants `role` works with: configured for admin/editor, the code matrix otherwise. */
export function effectiveGrants(role: UserRole, configured?: Partial<RoleGrants>): Grants {
  if (!isConfigurableRole(role)) return defaultGrants[role];
  const stored = configured?.[role];
  return stored ? normalizeRoleGrants(role, stored) : defaultGrants[role];
}

/**
 * Checking or unchecking one box of the matrix, keeping it consistent: a non-read action brings
 * "read" along, and removing "read" removes everything that depends on it.
 */
export function toggleAction(
  resource: Resource,
  current: readonly PermissionAction[],
  action: PermissionAction,
  checked: boolean,
): PermissionAction[] {
  if (!checked) {
    return action === "read" ? [] : current.filter((other) => other !== action);
  }
  return normalizeActions(resource, [...current, action]);
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

  // Configured grants apply to admin/editor only; super admin and mitra always use the code matrix.
  const table =
    actor.grants && isConfigurableRole(actor.role) ? actor.grants : defaultGrants[actor.role];
  if (!table[resource]?.includes(action)) return false;
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
