import { describe, expect, it } from "vitest";

import { resources } from "@/lib/permissions";

import { activeAdminItem, adminNavigation, plannedAdminModules } from "./admin-navigation";

describe("admin navigation", () => {
  const items = adminNavigation.flatMap((group) => group.items);

  it("has unique keys and paths under /admin, each guarded by a known resource", () => {
    expect(new Set(items.map((item) => item.key)).size).toBe(items.length);
    expect(new Set(items.map((item) => item.href)).size).toBe(items.length);
    for (const item of items) {
      expect(item.href.startsWith("/admin")).toBe(true);
      expect(resources).toContain(item.resource);
    }
  });

  it("lists placeholder modules by URL segment", () => {
    expect(plannedAdminModules.get("blog")?.resource).toBe("blog");
    // Built modules leave the placeholder list.
    expect(plannedAdminModules.has("calon-mitra")).toBe(false);
    expect(plannedAdminModules.has("")).toBe(false);
  });

  it("finds the active item by the longest matching prefix", () => {
    expect(activeAdminItem("/admin")?.key).toBe("overview");
    expect(activeAdminItem("/admin/blog")?.key).toBe("blog");
    expect(activeAdminItem("/admin/blog/tulis")?.key).toBe("blog");
    expect(activeAdminItem("/admin/blogger")).toBeUndefined();
  });
});
