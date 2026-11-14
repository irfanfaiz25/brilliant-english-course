import { describe, expect, it } from "vitest";

import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("quotes separators, quotes and line breaks", () => {
    expect(csvCell("Bogor, Jawa Barat")).toBe('"Bogor, Jawa Barat"');
    expect(csvCell('Kata "mitra"')).toBe('"Kata ""mitra"""');
    expect(csvCell("baris\nkedua")).toBe('"baris\nkedua"');
  });

  it("neutralizes formulas typed by the public", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+62812")).toBe("'+62812");
    expect(csvCell("@sum")).toBe("'@sum");
  });

  it("keeps numbers and empty values", () => {
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell(null)).toBe("");
  });
});

describe("toCsv", () => {
  it("writes a BOM, a header and CRLF lines", () => {
    expect(toCsv(["a", "b"], [["1", null]])).toBe("﻿a,b\r\n1,\r\n");
  });
});
