import type { Region } from "./schema";

/**
 * PLACEHOLDER subset of regions around the sample units. Phase 3 imports the full Kemendagri
 * dataset into the `regions` tables; names here are real places but codes may not match it exactly.
 */
export const regionFixtures: Region[] = [
  { code: "31", name: "DKI Jakarta" },
  { code: "31.74", name: "Kota Jakarta Selatan" },
  { code: "31.74.01", name: "Kebayoran Baru" },
  { code: "31.74.01.1001", name: "Senayan" },

  { code: "32", name: "Jawa Barat" },
  { code: "32.01", name: "Kab. Bogor" },
  { code: "32.01.01", name: "Cibinong" },
  { code: "32.01.01.1001", name: "Cibinong" },
  { code: "32.01.01.1002", name: "Pakansari" },
  { code: "32.01.01.1003", name: "Tengah" },
  { code: "32.01.02", name: "Gunung Putri" },
  { code: "32.01.02.2001", name: "Wanaherang" },
  { code: "32.01.02.2002", name: "Bojong Nangka" },
  { code: "32.01.05", name: "Sukamaju" },
  { code: "32.01.05.2001", name: "Sukamaju" },
  { code: "32.01.05.2002", name: "Sukamekar" },
  { code: "32.16", name: "Kab. Bekasi" },
  { code: "32.16.01", name: "Cikarang Utara" },
  { code: "32.16.01.1001", name: "Karangasih" },
  { code: "32.71", name: "Kota Bogor" },
  { code: "32.71.01", name: "Bogor Tengah" },
  { code: "32.71.01.1001", name: "Paledang" },
  { code: "32.76", name: "Kota Depok" },
  { code: "32.76.01", name: "Pancoran Mas" },
  { code: "32.76.01.1001", name: "Depok" },
  { code: "32.76.02", name: "Beji" },
  { code: "32.76.02.1001", name: "Beji" },
  { code: "32.76.02.1002", name: "Kukusan" },

  { code: "36", name: "Banten" },
  { code: "36.03", name: "Kab. Tangerang" },
  { code: "36.03.01", name: "Cikupa" },
  { code: "36.03.01.2001", name: "Bitung Jaya" },
];
