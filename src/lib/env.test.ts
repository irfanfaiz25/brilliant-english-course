import { describe, expect, it, vi } from "vitest";

vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/db");
vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-at-least-32-characters");

const { parseServerEnv } = await import("./env");

describe("parseServerEnv", () => {
  const valid = {
    DATABASE_URL: "postgres://user:pass@localhost:5432/db",
    BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
  };

  it("applies defaults", () => {
    expect(parseServerEnv(valid)).toMatchObject({ NODE_ENV: "development", DATABASE_POOL_MAX: 10 });
  });

  it("coerces numeric values", () => {
    expect(parseServerEnv({ ...valid, DATABASE_POOL_MAX: "5" }).DATABASE_POOL_MAX).toBe(5);
  });

  it("parses boolean flags from strings", () => {
    expect(parseServerEnv({ ...valid, ENABLE_DESIGN_PREVIEW: "true" }).ENABLE_DESIGN_PREVIEW).toBe(
      true,
    );
    expect(parseServerEnv({ ...valid, ENABLE_DESIGN_PREVIEW: "false" }).ENABLE_DESIGN_PREVIEW).toBe(
      false,
    );
    expect(parseServerEnv(valid).ENABLE_DESIGN_PREVIEW).toBeUndefined();
  });

  it("rejects a missing or non-postgres DATABASE_URL", () => {
    expect(() => parseServerEnv({})).toThrow(/DATABASE_URL/);
    expect(() => parseServerEnv({ ...valid, DATABASE_URL: "mysql://localhost/db" })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("requires a long auth secret", () => {
    expect(() => parseServerEnv({ ...valid, BETTER_AUTH_SECRET: undefined })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
    expect(() => parseServerEnv({ ...valid, BETTER_AUTH_SECRET: "short" })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
  });
});
