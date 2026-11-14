import { describe, expect, it } from "vitest";

import { accessLinkKind, accountChangeError, accountStatus } from "./rules";

const admin = { id: "admin-1", role: "super_admin" as const, isActive: true };
const other = { id: "admin-2", role: "super_admin" as const, isActive: true };
const editor = { id: "editor-1", role: "editor" as const, isActive: true };

describe("accountChangeError", () => {
  it("lets a super admin change someone else's role or switch them off", () => {
    expect(
      accountChangeError({
        actorId: admin.id,
        before: editor,
        after: { role: "admin", isActive: true },
        activeSuperAdmins: 1,
      }),
    ).toBeNull();
    expect(
      accountChangeError({
        actorId: admin.id,
        before: editor,
        after: { role: "editor", isActive: false },
        activeSuperAdmins: 1,
      }),
    ).toBeNull();
  });

  it("refuses changing one's own role or switching oneself off", () => {
    expect(
      accountChangeError({
        actorId: admin.id,
        before: admin,
        after: { role: "admin", isActive: true },
        activeSuperAdmins: 3,
      }),
    ).toBe("selfChange");
    expect(
      accountChangeError({
        actorId: admin.id,
        before: admin,
        after: { role: "super_admin", isActive: false },
        activeSuperAdmins: 3,
      }),
    ).toBe("selfChange");
  });

  it("allows saving one's own account when role and status stay", () => {
    expect(
      accountChangeError({
        actorId: admin.id,
        before: admin,
        after: { role: "super_admin", isActive: true },
        activeSuperAdmins: 1,
      }),
    ).toBeNull();
  });

  it("keeps the last active super admin", () => {
    const lastOne = { actorId: "someone-else", before: other, activeSuperAdmins: 1 };
    expect(accountChangeError({ ...lastOne, after: { role: "admin", isActive: true } })).toBe(
      "lastSuperAdmin",
    );
    expect(
      accountChangeError({ ...lastOne, after: { role: "super_admin", isActive: false } }),
    ).toBe("lastSuperAdmin");
    // With another active super admin it is fine.
    expect(
      accountChangeError({
        ...lastOne,
        activeSuperAdmins: 2,
        after: { role: "admin", isActive: true },
      }),
    ).toBeNull();
  });

  it("does not count a disabled super admin as losing access again", () => {
    const disabled = { ...other, isActive: false };
    expect(
      accountChangeError({
        actorId: admin.id,
        before: disabled,
        after: { role: "editor", isActive: false },
        activeSuperAdmins: 1,
      }),
    ).toBeNull();
  });
});

describe("accountStatus", () => {
  it("tells active, invited and disabled accounts apart", () => {
    expect(accountStatus({ isActive: true, hasPassword: true })).toBe("active");
    expect(accountStatus({ isActive: true, hasPassword: false })).toBe("invited");
    expect(accountStatus({ isActive: false, hasPassword: true })).toBe("disabled");
    expect(accountStatus({ isActive: false, hasPassword: false })).toBe("disabled");
  });
});

describe("accessLinkKind", () => {
  it("activates accounts without a password and resets the others", () => {
    expect(accessLinkKind(false)).toBe("activation");
    expect(accessLinkKind(true)).toBe("reset");
  });
});
