import type { Region } from "@/features/regions/schema";

/**
 * Small slice of the Kemendagri dataset (ADR-023) around the sample units, with display names as
 * `getRegion*` queries return them (`shortRegionName`). Used by unit tests that need regions
 * without a database; the real data comes from `regions.csv`.
 */
export const regionFixtures: Region[] = [
  { code: "31", name: "DKI Jakarta" },
  { code: "31.74", name: "Kota Jakarta Selatan" },
  { code: "31.74.07", name: "Kebayoran Baru" },
  { code: "31.74.07.1006", name: "Senayan" },

  { code: "32", name: "Jawa Barat" },
  { code: "32.01", name: "Kab. Bogor" },
  { code: "32.01.01", name: "Cibinong" },
  { code: "32.01.01.1006", name: "Cibinong" },
  { code: "32.01.01.1007", name: "Pakansari" },
  { code: "32.01.01.1008", name: "Tengah" },
  { code: "32.01.02", name: "Gunungputri" },
  { code: "32.01.02.2001", name: "Wanaherang" },
  { code: "32.01.02.2005", name: "Bojongnangka" },
  { code: "32.01.06", name: "Jonggol" },
  { code: "32.01.06.2001", name: "Sukamaju" },
  { code: "32.16", name: "Kab. Bekasi" },
  { code: "32.16.09", name: "Cikarang Utara" },
  { code: "32.16.09.2003", name: "Karangasih" },
  { code: "32.71", name: "Kota Bogor" },
  { code: "32.71.03", name: "Bogor Tengah" },
  { code: "32.71.03.1002", name: "Paledang" },
  { code: "32.76", name: "Kota Depok" },
  { code: "32.76.01", name: "Pancoran Mas" },
  { code: "32.76.01.1006", name: "Depok" },
  { code: "32.76.06", name: "Beji" },
  { code: "32.76.06.1001", name: "Beji" },
  { code: "32.76.06.1002", name: "Kukusan" },

  { code: "36", name: "Banten" },
  { code: "36.03", name: "Kab. Tangerang" },
  { code: "36.03.18", name: "Cikupa" },
  { code: "36.03.18.2009", name: "Bitung Jaya" },
];
