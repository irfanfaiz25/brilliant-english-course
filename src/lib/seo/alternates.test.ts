import { describe, expect, it } from "vitest";

import { localizedAlternates } from "./alternates";

describe("localizedAlternates", () => {
  it("uses unprefixed paths for the default locale", () => {
    expect(localizedAlternates("/", "id")).toEqual({
      canonical: "/",
      languages: { id: "/", en: "/en", "x-default": "/" },
    });
  });

  it("maps localized pathnames and sets the canonical to the current locale", () => {
    expect(localizedAlternates("/kemitraan", "en")).toEqual({
      canonical: "/en/partnership",
      languages: { id: "/kemitraan", en: "/en/partnership", "x-default": "/kemitraan" },
    });
  });
});
