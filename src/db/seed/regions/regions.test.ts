import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildRegionRows,
  countByLevel,
  parseRegionsCsv,
  parseWilayahSql,
  toRegionsCsv,
} from "./parse";
import meta from "./regions.meta.json";

const dir = new URL("./", import.meta.url);

describe("parseWilayahSql", () => {
  it("extracts code/name tuples and unescapes quotes", () => {
    const sql = `INSERT INTO wilayah (kode, nama) VALUES
('32','Jawa Barat'),
('32.01','Kabupaten Bogor'),
('32.01.01.1001','Pondok Rajeg'),
('53.01.01.2001','Bu Nuapu\\'u'),
('12.04.28','Ma''u'),
('73.26.12','Dende'' Piongan Napo'),
('61.01.09.2001','Kaliau''');`;
    expect(parseWilayahSql(sql)).toEqual([
      { code: "32", name: "Jawa Barat" },
      { code: "32.01", name: "Kabupaten Bogor" },
      { code: "32.01.01.1001", name: "Pondok Rajeg" },
      { code: "53.01.01.2001", name: "Bu Nuapu'u" },
      { code: "12.04.28", name: "Ma'u" },
      { code: "73.26.12", name: "Dende' Piongan Napo" },
      { code: "61.01.09.2001", name: "Kaliau'" },
    ]);
  });

  it("fails loudly instead of dropping a tuple it cannot read", () => {
    const sql = `INSERT INTO wilayah (kode, nama) VALUES ('32','Jawa Barat'),('33','Jawa "Tengah);`;
    expect(() => parseWilayahSql(sql)).toThrow(/Parsed 1 of 2/);
  });
});

describe("buildRegionRows", () => {
  it("derives level and parent, orders by level and skips orphans", () => {
    const { rows, skipped, invalid } = buildRegionRows([
      { code: "32.01.01.1001", name: "Pondok Rajeg" },
      { code: "32.01.01", name: "Cibinong" },
      { code: "32.01", name: "Kabupaten Bogor" },
      { code: "32", name: "Jawa Barat" },
      // District 32.01.99 does not exist, so this village cannot be imported.
      { code: "32.01.99.2001", name: "Orphan" },
      { code: "3x", name: "Bad code" },
      { code: "33", name: "" },
    ]);
    expect(rows.map((row) => row.code)).toEqual(["32", "32.01", "32.01.01", "32.01.01.1001"]);
    expect(rows[0]).toEqual({
      code: "32",
      name: "Jawa Barat",
      parentCode: null,
      level: "province",
    });
    expect(rows[3]?.parentCode).toBe("32.01.01");
    expect(rows[3]?.level).toBe("village");
    expect(skipped).toEqual([{ code: "32.01.99.2001", name: "Orphan" }]);
    expect(invalid.map((record) => record.code)).toEqual(["3x", "33"]);
    expect(countByLevel(rows)).toEqual({ province: 1, regency: 1, district: 1, village: 1 });
  });
});

describe("regions CSV", () => {
  it("round-trips names with commas and quotes", () => {
    const records = [
      { code: "12.07.01.2001", name: "Lubuk Pakam I,II" },
      { code: "12.07.01.2002", name: 'Dusun "Baru"' },
      { code: "12.07.01.2003", name: "Plain" },
    ];
    const csv = toRegionsCsv(records);
    expect(csv.split("\n")[1]).toBe('12.07.01.2001,"Lubuk Pakam I,II"');
    expect(parseRegionsCsv(csv)).toEqual(records);
  });

  it("rejects a file without the expected header", () => {
    expect(() => parseRegionsCsv("kode,nama\n32,Jawa Barat\n")).toThrow(/header/);
  });
});

describe("checked-in dataset", () => {
  it("matches its metadata and has no orphans", () => {
    const records = parseRegionsCsv(readFileSync(new URL("regions.csv", dir), "utf8"));
    const { rows, skipped, invalid } = buildRegionRows(records);
    expect(invalid).toEqual([]);
    expect(skipped).toEqual([]);
    expect(rows).toHaveLength(records.length);
    expect(countByLevel(rows)).toEqual(meta.counts);
    expect(meta.skipped).toHaveLength(meta.skippedCount);
  });

  it("covers every province and regency of Indonesia", () => {
    expect(meta.counts.province).toBe(38);
    expect(meta.counts.regency).toBe(514);
  });
});
