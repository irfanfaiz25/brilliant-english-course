import { describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ SITE_INDEXING: false }));
vi.mock("@/lib/env", () => ({ env }));

const { default: robots } = await import("./robots");

describe("robots.txt", () => {
  it("closes the whole site until launch", () => {
    env.SITE_INDEXING = false;
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("opens the public site and keeps the staff area and API closed after launch", () => {
    env.SITE_INDEXING = true;
    expect(robots().rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    });
  });
});
