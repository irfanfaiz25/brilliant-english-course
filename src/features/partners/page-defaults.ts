import type {
  ItemTexts,
  PartnershipBenefits,
  PartnershipKit,
  PartnershipPageContent,
  PartnershipSteps,
  PartnershipTraining,
} from "./page-schema";

/*
 * Code defaults of the Kemitraan page sections (ADR-041), used until an admin saves them. The copy
 * follows BEC's current partnership page (beccourses.com/kemitraan-bec). PLACEHOLDER: no photos
 * (cards show their icon) and the investment stays `null` (explained during the consultation).
 */

const texts = (id: [string, string], en: [string, string]): ItemTexts => ({
  id: { title: id[0], text: id[1] },
  en: { title: en[0], text: en[1] },
});

export const partnershipBenefitsDefaults: PartnershipBenefits = {
  items: [
    {
      icon: "coins",
      iconImageId: "",
      featured: true,
      texts: texts(
        [
          "Tanpa bagi hasil",
          "Pendapatan unitmu sepenuhnya milikmu. Tidak ada setoran bulanan ke pusat.",
        ],
        ["No profit sharing", "Your unit's income is all yours. No monthly share to head office."],
      ),
    },
    {
      icon: "home",
      iconImageId: "",
      featured: true,
      texts: texts(
        [
          "Tanpa syarat lokasi kelas",
          "Kelas boleh di rumah, teras, atau ruang mana pun yang nyaman untuk anak.",
        ],
        [
          "No venue requirements",
          "Teach at home, on the porch or in any room that is comfortable for children.",
        ],
      ),
    },
    {
      icon: "map",
      iconImageId: "",
      featured: true,
      texts: texts(
        [
          "Wilayah terlindungi",
          "Satu kelurahan untuk satu unit, jadi calon siswamu tidak terbagi. Unit kedua hanya dengan syarat tertentu.",
        ],
        [
          "Protected area",
          "One unit per village, so your future students are not split. A second unit only under certain conditions.",
        ],
      ),
    },
    {
      icon: "book",
      iconImageId: "",
      featured: false,
      texts: texts(
        ["Materi lengkap & siap pakai", "Modul, silabus, dan rencana pertemuan sudah disiapkan."],
        [
          "Complete, ready-to-use materials",
          "Modules, syllabus and lesson plans are ready for you.",
        ],
      ),
    },
    {
      icon: "layers",
      iconImageId: "",
      featured: false,
      texts: texts(
        [
          "Program untuk semua jenjang",
          "Dari Kindy Class sampai Secondary, untuk anak TK hingga SMP.",
        ],
        [
          "Programs for every age",
          "From Kindy Class to Secondary, for kindergarten to junior high.",
        ],
      ),
    },
    {
      icon: "palette",
      iconImageId: "",
      featured: false,
      texts: texts(
        ["Modul berwarna ukuran besar", "Tampilan menarik yang membuat anak betah belajar."],
        ["Large, full-colour modules", "Attractive pages that keep children engaged."],
      ),
    },
    {
      icon: "worksheet",
      iconImageId: "",
      featured: false,
      texts: texts(
        ["Worksheet pengayaan", "Latihan tambahan untuk menguatkan materi setiap pertemuan."],
        ["Enrichment worksheets", "Extra practice that reinforces every lesson."],
      ),
    },
    {
      icon: "chat",
      iconImageId: "",
      featured: false,
      texts: texts(
        [
          "Grup diskusi mitra",
          "Tanya jawab dan berbagi pengalaman dengan tim BEC dan sesama mitra.",
        ],
        [
          "Partner discussion group",
          "Ask questions and share experience with BEC and other partners.",
        ],
      ),
    },
  ],
};

export const partnershipKitDefaults: PartnershipKit = {
  investment: null,
  items: [
    {
      group: "materials",
      icon: "book",
      iconImageId: "",
      imageId: "",
      texts: texts(
        ["Modul belajar level 1–5", "Modul berwarna untuk setiap tahap belajar."],
        ["Learning modules, levels 1–5", "Full-colour modules for every stage."],
      ),
    },
    {
      group: "materials",
      icon: "layers",
      iconImageId: "",
      imageId: "",
      texts: texts(
        ["5 buku BEC 1A", "Untuk murid baru di bulan pertama."],
        ["5 BEC 1A books", "For new students in the first month."],
      ),
    },
    {
      group: "materials",
      icon: "clipboard",
      iconImageId: "",
      imageId: "",
      texts: texts(
        ["Silabus", "Urutan materi dan target setiap level."],
        ["Syllabus", "The order of topics and goals for each level."],
      ),
    },
    {
      group: "materials",
      icon: "folder",
      iconImageId: "",
      imageId: "",
      texts: texts(
        ["Bank data pengayaan", "Kumpulan materi tambahan BEC di Google Drive."],
        ["Enrichment library", "BEC's extra materials on Google Drive."],
      ),
    },
    {
      group: "classroom",
      icon: "flag",
      iconImageId: "",
      imageId: "",
      texts: texts(
        ["Banner 2×1 m & 0,5×1 m", "Penanda unit di depan rumah dan di dalam kelas."],
        ["Banners, 2×1 m & 0.5×1 m", "Signs for the front of the house and the classroom."],
      ),
    },
    {
      group: "classroom",
      icon: "dice",
      iconImageId: "",
      imageId: "",
      texts: texts(
        ["Boardgames", "Permainan papan untuk belajar sambil bermain."],
        ["Board games", "Games that turn practice into play."],
      ),
    },
    {
      group: "guides",
      icon: "presentation",
      iconImageId: "",
      imageId: "",
      texts: texts(
        ["Teacher handbook", "Panduan mengajar langkah demi langkah untuk tutor."],
        ["Teacher handbook", "A step-by-step teaching guide for tutors."],
      ),
    },
    {
      group: "guides",
      icon: "worksheet",
      iconImageId: "",
      imageId: "",
      texts: texts(
        ["Berkas administrasi bimbel", "Formulir pendaftaran, absensi, dan laporan siswa."],
        ["Admin templates", "Enrolment forms, attendance sheets and student reports."],
      ),
    },
    {
      group: "guides",
      icon: "graduation",
      iconImageId: "",
      imageId: "",
      texts: texts(
        ["Pelatihan tutor BEC", "Pelatihan cara mengajar dengan metode BEC."],
        ["BEC tutor training", "Training in the BEC teaching method."],
      ),
    },
  ],
};

export const partnershipTrainingDefaults: PartnershipTraining = {
  photos: [],
  flow: [
    {
      texts: texts(
        ["Pembukaan", "Salam, doa, dan pemanasan singkat supaya anak siap belajar."],
        ["Opening", "Greetings and a short warm-up so children are ready to learn."],
      ),
    },
    {
      texts: texts(
        ["Apersepsi", "Mengulang materi sebelumnya dan mengaitkannya dengan topik hari ini."],
        ["Recall", "Review the last lesson and link it to today's topic."],
      ),
    },
    {
      texts: texts(
        ["Mengerjakan modul", "Anak belajar dan berlatih langsung di modul BEC."],
        ["Module work", "Children learn and practise in the BEC module."],
      ),
    },
    {
      texts: texts(
        ["Pengayaan", "Worksheet tambahan untuk menguatkan pemahaman."],
        ["Enrichment", "Extra worksheets that deepen understanding."],
      ),
    },
    {
      texts: texts(
        ["Permainan", "Boardgames dan games kelas supaya anak berani bicara."],
        ["Games", "Board and classroom games that get children talking."],
      ),
    },
    {
      texts: texts(
        ["Penutup", "Rangkuman, apresiasi, dan pesan untuk pertemuan berikutnya."],
        ["Closing", "A recap, praise and a note for next time."],
      ),
    },
  ],
  formats: [
    {
      icon: "monitor",
      iconImageId: "",
      texts: texts(
        ["Online atau offline", "Pilih yang paling mudah: lewat video call atau tatap muka."],
        ["Online or in person", "Whichever is easiest: by video call or face to face."],
      ),
    },
    {
      icon: "clipboard",
      iconImageId: "",
      texts: texts(
        ["Pelatihan administrasi", "Cara mengelola pendaftaran, absensi, dan laporan siswa."],
        ["Admin training", "How to run enrolment, attendance and student reports."],
      ),
    },
    {
      icon: "bookSearch",
      iconImageId: "",
      texts: texts(
        ["Bedah buku bersama", "Membahas buku BEC dan program lainnya bersama tim."],
        ["Book walkthroughs", "Go through BEC books and programs with the team."],
      ),
    },
  ],
};

export const partnershipStepsDefaults: PartnershipSteps = {
  items: [
    {
      icon: "map",
      iconImageId: "",
      action: "quota",
      texts: texts(
        [
          "Cek ketersediaan kelurahan",
          "Pastikan masih ada slot di kelurahan tempat unitmu dibuka.",
        ],
        ["Check your village", "Make sure your village still has a free slot."],
      ),
    },
    {
      icon: "clipboard",
      iconImageId: "",
      action: "apply",
      texts: texts(
        ["Isi formulir pendaftaran", "Kirim data singkat; formulirmu langsung diterima admin BEC."],
        ["Fill in the application", "Send a short form; it goes straight to the BEC team."],
      ),
    },
    {
      icon: "coins",
      iconImageId: "",
      action: "none",
      texts: texts(
        ["Bayar biaya kemitraan", "Rincian biaya dijelaskan tim kemitraan saat konsultasi."],
        [
          "Pay the partnership fee",
          "The partnership team explains the fee during the consultation.",
        ],
      ),
    },
    {
      icon: "calendar",
      iconImageId: "",
      action: "none",
      texts: texts(
        ["Jadwalkan pelatihan", "Pilih jadwal pelatihan online atau offline."],
        ["Schedule your training", "Pick an online or in-person training date."],
      ),
    },
    {
      icon: "users",
      iconImageId: "",
      action: "whatsapp",
      texts: texts(
        ["Gabung grup BEC", "Bergabung dengan grup mitra untuk diskusi dan info terbaru."],
        ["Join the BEC group", "Join the partner group for discussion and updates."],
      ),
    },
  ],
};

export const partnershipPageDefaults: PartnershipPageContent = {
  benefits: partnershipBenefitsDefaults,
  kit: partnershipKitDefaults,
  training: partnershipTrainingDefaults,
  steps: partnershipStepsDefaults,
};
