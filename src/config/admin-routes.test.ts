import { describe, expect, it } from "vitest";

import { adminRoutes, safeAdminRedirect } from "./admin-routes";

describe("safeAdminRedirect", () => {
  it("keeps admin paths with their query", () => {
    expect(safeAdminRedirect("/admin")).toBe("/admin");
    expect(safeAdminRedirect("/admin/kemitraan?status=new")).toBe("/admin/kemitraan?status=new");
  });

  it("falls back to the dashboard for anything else", () => {
    for (const next of [
      null,
      undefined,
      "",
      "/",
      "/kemitraan",
      "/administrator",
      "//evil.com/admin",
      "https://evil.com/admin",
      "/admin\\@evil.com",
      "/admin /x",
      adminRoutes.signIn,
      `${adminRoutes.resetPassword}?token=x`,
    ]) {
      expect(safeAdminRedirect(next)).toBe(adminRoutes.home);
    }
  });
});
