import type { Locale } from "@/i18n/routing";

import type { PartnershipPackage } from "./schema";

/**
 * PLACEHOLDER partnership package until admin settings (Phase 4a). The investment is not public
 * yet, so it stays `null` (the page says it is explained during the consultation). Confirm the
 * inclusions with BEC before launch.
 */
export const partnershipPackageFixtures: Record<Locale, PartnershipPackage> = {
  id: {
    investment: null,
    inclusions: [
      "Hak pakai merek BEC untuk satu unit",
      "Kurikulum, modul siswa, dan panduan pengajar",
      "Pelatihan metode mengajar untuk pemilik dan pengajar",
      "Paket materi promosi cetak dan digital",
      "Sistem pendaftaran siswa dan laporan perkembangan",
      "Pendampingan tim kemitraan setelah unit aktif",
    ],
  },
  en: {
    investment: null,
    inclusions: [
      "Licence to use the BEC brand for one unit",
      "Curriculum, student modules and teacher guides",
      "Teaching-method training for the owner and teachers",
      "Printed and digital marketing kit",
      "Student enrolment and progress-report system",
      "Ongoing support from the partnership team",
    ],
  },
};
