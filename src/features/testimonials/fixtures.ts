import type { Locale } from "@/i18n/routing";

import type { Testimonial } from "./schema";

/** PLACEHOLDER testimonials until the testimonials admin module (Phase 4f). Names are fictional. */
export const testimonialFixtures: Record<Locale, Testimonial[]> = {
  id: [
    {
      id: "t1",
      audience: "parent",
      quote:
        "Dulu Naura malu kalau disuruh ngomong bahasa Inggris. Sekarang dia yang semangat cerita pakai bahasa Inggris tiap pulang les.",
      author: "Ibu Sari",
      role: "Orang tua siswa Kindy · Kab. Bogor",
      rating: 5,
    },
    {
      id: "t2",
      audience: "parent",
      quote:
        "Kegiatan Market Day jadi favorit anak saya. Belajarnya tidak terasa seperti les, tapi nilainya di sekolah ikut naik.",
      author: "Bapak Dimas",
      role: "Orang tua siswa Intro · Kota Depok",
      rating: 5,
    },
    {
      id: "t3",
      audience: "parent",
      quote:
        "Kelasnya kecil jadi gurunya kenal tiap anak. Laporan perkembangannya jelas dan admin unitnya cepat dihubungi lewat WhatsApp.",
      author: "Ibu Wulan",
      role: "Orang tua siswa Secondary · Kab. Bekasi",
      rating: 5,
    },
    {
      id: "p1",
      audience: "partner",
      quote:
        "Anak-anak tetangga sekarang belajar di ruang tamu saya. Modulnya lengkap, jadi saya tinggal fokus mengajar dan mendampingi mereka.",
      author: "Ibu Wulan",
      role: "Mitra BEC · Kab. Bogor",
      rating: 5,
    },
    {
      id: "p2",
      audience: "partner",
      quote:
        "Pelatihannya praktis dan tim BEC cepat membantu kalau ada kendala. Unit saya penuh di tahun pertama.",
      author: "Bapak Hendra",
      role: "Mitra BEC · Kota Depok",
      rating: 5,
    },
    {
      id: "p3",
      audience: "partner",
      quote:
        "Saya bukan lulusan sastra Inggris, tapi metode BEC mudah diikuti. Sekarang saya punya usaha yang bermanfaat untuk desa sendiri.",
      author: "Ibu Maya",
      role: "Mitra BEC · Kab. Bekasi",
      rating: 5,
    },
  ],
  en: [
    {
      id: "t1",
      audience: "parent",
      quote:
        "Naura used to be shy about speaking English. Now she's the one excitedly telling stories in English after every class.",
      author: "Mrs. Sari",
      role: "Parent of a Kindy student · Bogor Regency",
      rating: 5,
    },
    {
      id: "t2",
      audience: "parent",
      quote:
        "Market Day is my son's favourite. It doesn't feel like a course, yet his English grades at school went up too.",
      author: "Mr. Dimas",
      role: "Parent of an Intro student · Depok",
      rating: 5,
    },
    {
      id: "t3",
      audience: "parent",
      quote:
        "Small classes mean the teacher knows every child. Progress reports are clear and the unit admin replies quickly on WhatsApp.",
      author: "Mrs. Wulan",
      role: "Parent of a Secondary student · Bekasi Regency",
      rating: 5,
    },
    {
      id: "p1",
      audience: "partner",
      quote:
        "Neighbourhood kids now learn in my living room. The modules are complete, so I can focus on teaching and guiding them.",
      author: "Mrs. Wulan",
      role: "BEC partner · Bogor Regency",
      rating: 5,
    },
    {
      id: "p2",
      audience: "partner",
      quote:
        "The training is practical and the BEC team helps quickly whenever something comes up. My unit was full in its first year.",
      author: "Mr. Hendra",
      role: "BEC partner · Depok City",
      rating: 5,
    },
    {
      id: "p3",
      audience: "partner",
      quote:
        "I didn't study English literature, but the BEC method is easy to follow. Now I run a business that helps my own village.",
      author: "Mrs. Maya",
      role: "BEC partner · Bekasi Regency",
      rating: 5,
    },
  ],
};
