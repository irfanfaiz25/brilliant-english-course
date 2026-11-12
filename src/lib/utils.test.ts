import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("keeps custom font-size tokens next to text colors", () => {
    expect(cn("text-h1", "text-primary")).toBe("text-h1 text-primary");
    expect(cn("text-body text-muted-foreground")).toBe("text-body text-muted-foreground");
  });

  it("resolves conflicts within the same group", () => {
    expect(cn("text-body", "text-h2")).toBe("text-h2");
    expect(cn("bg-primary", "bg-partner")).toBe("bg-partner");
    expect(cn("shadow-sm", "shadow-brand")).toBe("shadow-brand");
  });

  it("ignores falsy values", () => {
    expect(cn("px-4", false, undefined, null, "py-2")).toBe("px-4 py-2");
  });
});
