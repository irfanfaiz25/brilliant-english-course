import type { ContactSettings } from "@/features/settings/schema";

import type { UnitRecord } from "../insert";

/**
 * Starter content for production (`pnpm db:starter`, ADR-046): enough real data for the site to
 * make sense on launch day, entered once into an empty database. The BEC team edits or replaces
 * all of it in admin.
 *
 * Sources, checked on 2026-11-15:
 * - units: three partners from the old site's list (beccourses.com/daftar-mitra-bec-course): unit
 *   number, owner, WhatsApp and address are theirs. Coordinates are approximate village centres,
 *   and hours, levels, enrollment and student counts are DUMMY until each partner confirms them;
 * - contact: head office address and WhatsApp from beccourses.com (home and Kontak Kami). The
 *   email, office hours and social links are DUMMY (the old site has none).
 *
 * Programs, activities and FAQ reuse the reviewed copy of `../content` with its placeholder photos.
 */

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKDAYS_AND_SATURDAY = [1, 2, 3, 4, 5, 6];

export const starterUnits: UnitRecord[] = [
  {
    code: "BEC-JB-0002",
    slug: "tanah-baru",
    name: "Unit Tanah Baru",
    address:
      "Jl. Karya Bakti No. 3, RT 004/RW 05, Kel. Tanah Baru, Kec. Beji, Kota Depok, Jawa Barat",
    district: "Beji",
    regency: "Kota Depok",
    villageCode: "32.76.06.1003",
    location: { lat: -6.3718, lng: 106.8045 },
    manager: "Ibu Siti Mariam",
    whatsapp: "6285701009493",
    openDays: WEEKDAYS_AND_SATURDAY,
    opensAt: "14:00",
    closesAt: "18:00",
    levels: ["kindy", "elementary", "secondary"],
    enrollment: "open",
    studentsCount: 48,
    // "Mulai aktif" on the old list.
    openedAt: "2021-08-18",
  },
  {
    code: "BEC-LA-0101",
    slug: "sukabumi-indah",
    name: "Unit Sukabumi Indah",
    address: "Jl. Pulau Singkep, Kel. Sukabumi Indah, Kec. Sukabumi, Kota Bandar Lampung, Lampung",
    district: "Sukabumi",
    regency: "Kota Bandar Lampung",
    villageCode: "18.71.12.1004",
    location: { lat: -5.4068, lng: 105.2866 },
    manager: "Ibu Evi Febriani",
    whatsapp: "628990969000",
    openDays: WEEKDAYS,
    opensAt: "15:00",
    closesAt: "18:00",
    levels: ["kindy", "elementary"],
    enrollment: "open",
    studentsCount: 32,
    // The old list has no start date; the day the unit was recorded there.
    openedAt: "2024-02-17",
  },
  {
    code: "BEC-JT-0116",
    slug: "singorojo",
    name: "Unit Singorojo",
    address:
      "Perumahan Mayong Raya Indah, RT 008/RW 03, Desa Singorojo, Kec. Mayong, Kab. Jepara, Jawa Tengah",
    district: "Mayong",
    regency: "Kab. Jepara",
    villageCode: "33.20.04.2008",
    location: { lat: -6.7316, lng: 110.7541 },
    manager: "Ibu Hilda Febriani, S.Pd.",
    whatsapp: "6285112424092",
    openDays: [1, 3, 5],
    opensAt: "15:30",
    closesAt: "18:30",
    levels: ["elementary", "secondary"],
    enrollment: "limited",
    studentsCount: 27,
    // The old list has no start date; the day the unit was recorded there.
    openedAt: "2024-02-17",
  },
];

export const starterContact: ContactSettings = {
  // The home page links this number (twice); Kontak Kami links 0877-4824-1961. Confirm with BEC.
  whatsapp: "6287784241961",
  email: "halo@beccourses.com",
  address:
    "Sawangan Permai Blok F.7 No. 21, Kel. Pasir Putih, Kec. Sawangan, Kota Depok, Jawa Barat",
  officeHours: [
    { days: [1, 2, 3, 4, 5], opens: "08:00", closes: "16:00" },
    { days: [6], opens: "08:00", closes: "12:00" },
  ],
  social: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    youtube: "https://www.youtube.com/",
    tiktok: "https://www.tiktok.com/",
  },
};
