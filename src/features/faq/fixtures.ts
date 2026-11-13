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
    {
      id: "fee-program",
      topic: "program",
      question: "Berapa biaya kursus di BEC?",
      answer:
        "Biaya ditentukan tiap unit. Hubungi unit terdekat lewat halaman Cek Unit untuk info biaya dan jadwal.",
    },
    {
      id: "placement-program",
      topic: "program",
      question: "Apakah ada tes penempatan?",
      answer:
        "Ada. Sebelum mulai, anak ikut placement test singkat dan santai di unit supaya masuk ke level yang paling pas.",
    },
    {
      id: "prior-knowledge",
      topic: "program",
      question: "Bagaimana kalau anak sudah bisa sedikit bahasa Inggris?",
      answer:
        "Tidak masalah. Hasil placement test menentukan level dan modul awal, jadi anak tidak mengulang materi yang sudah dikuasai.",
    },
    {
      id: "transfer",
      topic: "program",
      question: "Apakah bisa pindah unit?",
      answer:
        "Bisa. Semua unit memakai kurikulum yang sama, jadi anak bisa melanjutkan level yang sama di unit lain. Koordinasikan dengan admin kedua unit.",
    },
    {
      id: "fluent",
      topic: "partners",
      question: "Apakah saya harus fasih berbahasa Inggris?",
      answer:
        "Tidak harus fasih. Cukup punya dasar bahasa Inggris dan senang dengan anak-anak. BEC memberikan pelatihan metode mengajar, modul lengkap, dan pendampingan. Kamu juga bisa merekrut pengajar yang dilatih bersama BEC.",
    },
    {
      id: "investment",
      topic: "partners",
      question: "Berapa biaya investasi kemitraan?",
      answer:
        "Rincian investasi dan apa saja yang termasuk di dalamnya dijelaskan saat konsultasi. Hubungi tim kemitraan lewat WhatsApp untuk penawaran terbaru.",
    },
    {
      id: "quota",
      topic: "partners",
      question: "Kenapa maksimal 2 unit per desa?",
      answer:
        "Supaya setiap unit punya cukup calon siswa dan tidak saling berebut. Kuota dihitung dari unit yang sudah aktif ditambah mitra yang sedang proses bergabung di desa tersebut.",
    },
    {
      id: "space",
      topic: "partners",
      question: "Ruangan seperti apa yang dibutuhkan?",
      answer:
        "Ruang tamu atau ruangan yang nyaman untuk kelas kecil sudah cukup. Saat survei, tim BEC membantu menata ruang belajar supaya aman dan menyenangkan untuk anak.",
    },
    {
      id: "timeline",
      topic: "partners",
      question: "Berapa lama sampai unit bisa mulai beroperasi?",
      answer:
        "Tergantung kesiapan tempat dan jadwal pelatihan. Setelah konsultasi, tim kemitraan menyusun jadwal persiapan bersamamu sampai kelas pertama dibuka.",
    },
    {
      id: "after-apply",
      topic: "partners",
      question: "Apa yang terjadi setelah saya mengisi formulir?",
      answer:
        "Tim kemitraan BEC menghubungimu lewat WhatsApp untuk konsultasi, lalu menjadwalkan survei lokasi, pelatihan, dan persiapan pembukaan unit.",
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
    {
      id: "fee-program",
      topic: "program",
      question: "How much does a BEC course cost?",
      answer:
        "Fees are set by each unit. Contact your nearest unit via the Find a Unit page for fees and schedules.",
    },
    {
      id: "placement-program",
      topic: "program",
      question: "Is there a placement test?",
      answer:
        "Yes. Before starting, children take a short, relaxed placement test at the unit so they join the level that fits best.",
    },
    {
      id: "prior-knowledge",
      topic: "program",
      question: "What if my child already knows some English?",
      answer:
        "No problem. The placement test sets the starting level and module, so your child won't repeat what they already know.",
    },
    {
      id: "transfer",
      topic: "program",
      question: "Can my child move to another unit?",
      answer:
        "Yes. All units use the same curriculum, so your child can continue the same level at another unit. Just coordinate with both unit admins.",
    },
    {
      id: "fluent",
      topic: "partners",
      question: "Do I need to be fluent in English?",
      answer:
        "Not necessarily. A basic command of English and a love for children are enough. BEC provides teaching-method training, complete modules and mentoring. You can also hire teachers who are trained together with BEC.",
    },
    {
      id: "investment",
      topic: "partners",
      question: "How much is the partnership investment?",
      answer:
        "The investment and everything it includes are explained during the consultation. Message the partnership team on WhatsApp for the latest offer.",
    },
    {
      id: "quota",
      topic: "partners",
      question: "Why at most 2 units per village?",
      answer:
        "So every unit has enough prospective students and units don't compete with each other. The quota counts active units plus partners who are currently joining in that village.",
    },
    {
      id: "space",
      topic: "partners",
      question: "What kind of room do I need?",
      answer:
        "A living room or any comfortable room for a small class is enough. During the site visit, the BEC team helps you set up a safe and fun learning space for children.",
    },
    {
      id: "timeline",
      topic: "partners",
      question: "How long until my unit can open?",
      answer:
        "It depends on your space and the training schedule. After the consultation, the partnership team plans the preparation with you up to the first class.",
    },
    {
      id: "after-apply",
      topic: "partners",
      question: "What happens after I submit the form?",
      answer:
        "The BEC partnership team contacts you on WhatsApp for a consultation, then schedules the site visit, training and the unit's opening preparation.",
    },
  ],
};
