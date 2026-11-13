import type { UnitSummary } from "./schema";

/** PLACEHOLDER units from the Penpot design until units are stored (Phase 3). Contacts are fake. */
export const unitFixtures: UnitSummary[] = [
  {
    code: "BEC-JB-0123",
    name: "Unit Sukamaju",
    address: "Jl. Raya Sukamaju No. 12, Desa Sukamaju, Kec. Sukamaju, Kab. Bogor, Jawa Barat",
    district: "Sukamaju",
    regency: "Kab. Bogor",
    manager: "Ibu Rina Lestari",
    whatsapp: "6281200000001",
    openDays: [1, 2, 3, 4, 5, 6],
    opensAt: "14:00",
    closesAt: "18:00",
    levels: ["kindy", "intro", "secondary"],
    enrollment: "open",
  },
  {
    code: "BEC-JB-0098",
    name: "Unit Cibinong",
    address: "Jl. Mayor Oking No. 45, Kel. Cibinong, Kec. Cibinong, Kab. Bogor, Jawa Barat",
    district: "Cibinong",
    regency: "Kab. Bogor",
    manager: "Bapak Andi Pratama",
    whatsapp: "6281200000002",
    openDays: [1, 2, 3, 4, 5],
    opensAt: "15:00",
    closesAt: "19:00",
    levels: ["kindy", "intro"],
    enrollment: "limited",
  },
];
