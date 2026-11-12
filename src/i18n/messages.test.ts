import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import id from "../../messages/id.json";

/** Flattens nested message objects into dot-separated keys. */
function keysOf(messages: object, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null ? keysOf(value, path) : [path];
  });
}

describe("message dictionaries", () => {
  it("id and en define exactly the same keys", () => {
    expect(keysOf(en).sort()).toEqual(keysOf(id).sort());
  });

  it("have no empty strings", () => {
    for (const dictionary of [id, en]) {
      const empty = keysOf(dictionary).filter((key) => {
        const value = key.split(".").reduce<unknown>((node, part) => {
          return (node as Record<string, unknown>)[part];
        }, dictionary);
        return typeof value === "string" && value.trim() === "";
      });
      expect(empty).toEqual([]);
    }
  });
});
