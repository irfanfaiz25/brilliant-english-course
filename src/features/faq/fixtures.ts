import type { Locale } from "@/i18n/routing";

import type { FaqItem } from "./schema";

/** PLACEHOLDER FAQ until the FAQ admin module (Phase 4f). Confirm answers with BEC before launch. */
export const faqFixtures: Record<Locale, FaqItem[]> = {
  id: [
    {
      id: "age",
      topic: "parents",
      question: "Mulai usia berapa anak bisa ikut kelas BEC?",
      answer:
        "Anak bisa mulai dari usia 4 tahun di level Kindy, lalu lanjut ke Intro (7–9 tahun) dan Secondary (10–15 tahun).",
    },
    {
      id: "schedule",
      topic: "parents",
      question: "Berapa kali pertemuan dalam seminggu?",
      answer:
        "Jadwal mengikuti masing-masing unit, umumnya dua kali seminggu dengan durasi sekitar 60–90 menit per pertemuan.",
    },
    {
      id: "placement",
      topic: "parents",
      question: "Apakah ada tes sebelum mulai belajar?",
      answer:
        "Ada placement test singkat dan santai di unit untuk menentukan level yang paling pas untuk anak.",
    },
    {
      id: "fee",
      topic: "parents",
      question: "Berapa biaya kursusnya?",
      answer:
        "Biaya dapat berbeda di tiap unit. Hubungi admin unit terdekat lewat WhatsApp untuk info biaya dan promo terbaru.",
    },
    {
      id: "progress",
      topic: "parents",
      question: "Bagaimana saya tahu perkembangan anak?",
      answer:
        "Pengajar memberikan laporan perkembangan berkala, dan orang tua bisa berdiskusi langsung dengan admin unit.",
    },
  ],
  en: [
    {
      id: "age",
      topic: "parents",
      question: "From what age can children join BEC?",
      answer:
        "Children can start at age 4 in Kindy, then move on to Intro (ages 7–9) and Secondary (ages 10–15).",
    },
    {
      id: "schedule",
      topic: "parents",
      question: "How many classes are there per week?",
      answer:
        "Schedules depend on each unit, usually twice a week for about 60–90 minutes per class.",
    },
    {
      id: "placement",
      topic: "parents",
      question: "Is there a test before starting?",
      answer:
        "There is a short, relaxed placement test at the unit to find the level that suits your child best.",
    },
    {
      id: "fee",
      topic: "parents",
      question: "How much does the course cost?",
      answer:
        "Fees may differ between units. Contact the nearest unit's admin on WhatsApp for current fees and promotions.",
    },
    {
      id: "progress",
      topic: "parents",
      question: "How will I know how my child is doing?",
      answer:
        "Teachers share regular progress reports, and parents can talk directly with the unit admin.",
    },
  ],
};
