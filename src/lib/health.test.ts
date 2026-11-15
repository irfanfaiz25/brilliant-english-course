import { beforeEach, describe, expect, it, vi } from "vitest";

const { pingDatabase } = vi.hoisted(() => ({ pingDatabase: vi.fn<() => Promise<void>>() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ pingDatabase }));
vi.mock("@/lib/env", () => ({ env: { APP_VERSION: "abc1234" } }));

const { checkHealth } = await import("./health");

describe("checkHealth", () => {
  beforeEach(() => {
    pingDatabase.mockReset();
  });

  it("is ok when the database answers", async () => {
    pingDatabase.mockResolvedValue();
    await expect(checkHealth()).resolves.toEqual({ status: "ok", version: "abc1234" });
  });

  it("reports the database when it fails", async () => {
    pingDatabase.mockRejectedValue(new Error("connection refused"));
    await expect(checkHealth()).resolves.toEqual({
      status: "error",
      version: "abc1234",
      database: "unreachable",
    });
  });

  it("gives up on a database that does not answer", async () => {
    vi.useFakeTimers();
    pingDatabase.mockReturnValue(new Promise(() => {}));
    const report = checkHealth();
    await vi.advanceTimersByTimeAsync(3000);
    await expect(report).resolves.toMatchObject({ status: "error" });
    vi.useRealTimers();
  });
});
