import { placeholderImages } from "@/config/placeholder-images";
import type { Locale } from "@/i18n/routing";

import type { Activity } from "@/features/activities/schema";

/**
 * PLACEHOLDER content from the Penpot design (Phase 4b), with the detail popup copy and sample
 * photos of ADR-042.
 */
export const activityFixtures: Record<Locale, Activity[]> = {
  id: [
    {
      slug: "story-telling-day",
      name: "Story Telling Day",
      summary:
        "Anak berlatih bercerita dalam bahasa Inggris di depan teman — membangun percaya diri dan kosakata.",
      audience: "Semua level",
      image: {
        ...placeholderImages.activityStorytelling,
        alt: "Guru bercerita di depan anak-anak yang antusias",
      },
      description:
        "Setiap anak mendapat giliran membawakan cerita pendek dalam bahasa Inggris di depan teman-temannya. Tutor membantu dari persiapan sampai tampil, jadi anak berani bicara tanpa takut salah.",
      highlights: [
        "Memilih dan berlatih cerita pendek",
        "Bercerita di depan teman dengan alat peraga",
        "Memberi pujian dan pertanyaan untuk teman",
      ],
      skills: ["Speaking", "Kosakata", "Percaya diri"],
      schedule: "Sebulan sekali",
      photos: [
        { image: { ...placeholderImages.levelKindy, alt: "Dokumentasi kegiatan" }, caption: "" },
        { image: { ...placeholderImages.hero, alt: "Dokumentasi kegiatan" }, caption: "" },
      ],
    },
    {
      slug: "book-day",
      name: "Book Day",
      summary: "Membaca buku cerita bersama, lalu menceritakan ulang dan mendiskusikan isinya.",
      audience: "Semua level",
      image: {
        ...placeholderImages.activityBook,
        alt: "Anak laki-laki menulis di buku catatannya",
      },
      description:
        "Anak membaca buku cerita bergambar bersama, lalu menceritakan ulang isinya dengan kata-kata sendiri dan mendiskusikan pesan ceritanya.",
      highlights: [
        "Membaca buku cerita bersama tutor",
        "Menceritakan ulang dengan kata-kata sendiri",
        "Diskusi tokoh dan pesan cerita",
      ],
      skills: ["Reading", "Listening", "Kosakata"],
      schedule: "Dua bulan sekali",
      photos: [
        {
          image: { ...placeholderImages.levelSecondary, alt: "Dokumentasi kegiatan" },
          caption: "",
        },
      ],
    },
    {
      slug: "market-day",
      name: "Market Day",
      summary: "Simulasi jual-beli: anak menawarkan produk dan bertransaksi dalam bahasa Inggris.",
      audience: "Semua level",
      image: {
        ...placeholderImages.activityMarket,
        alt: "Anak-anak beraktivitas bersama di meja kelas",
      },
      description:
        "Kelas berubah menjadi pasar mini. Anak menyiapkan barang dagangan, menawarkan, menawar, dan menghitung uang, semuanya dalam bahasa Inggris.",
      highlights: [
        "Menyiapkan produk dan label harga",
        "Menawarkan dan menawar dalam bahasa Inggris",
        "Menghitung uang dan kembalian",
      ],
      skills: ["Speaking", "Berhitung", "Kerja sama"],
      schedule: "Setiap akhir semester",
      photos: [
        { image: { ...placeholderImages.levelIntro, alt: "Dokumentasi kegiatan" }, caption: "" },
      ],
    },
    {
      slug: "movie-day",
      name: "Movie Day",
      summary:
        "Nonton film anak berbahasa Inggris, lalu bermain kuis dan role-play dari adegannya.",
      audience: "Semua level",
      image: {
        ...placeholderImages.activityMovie,
        alt: "Anak-anak duduk di karpet kelas sambil mengangkat tangan",
      },
      description:
        "Nonton film anak berbahasa Inggris bersama, lalu bermain kuis dan role-play adegan favorit supaya kosakata baru langsung dipakai.",
      highlights: [
        "Nonton film anak pilihan tutor",
        "Kuis seru tentang isi film",
        "Role-play adegan favorit",
      ],
      skills: ["Listening", "Speaking", "Kosakata"],
      schedule: "Sebulan sekali",
      photos: [
        {
          image: { ...placeholderImages.activityStorytelling, alt: "Dokumentasi kegiatan" },
          caption: "",
        },
      ],
    },
  ],
  en: [
    {
      slug: "story-telling-day",
      name: "Story Telling Day",
      summary:
        "Children practise telling stories in English in front of friends — building confidence and vocabulary.",
      audience: "All levels",
      image: {
        ...placeholderImages.activityStorytelling,
        alt: "A teacher telling a story to excited children",
      },
      description:
        "Each child takes a turn telling a short story in English in front of friends. Tutors help from preparation to performance, so children speak up without fear of mistakes.",
      highlights: [
        "Choose and practise a short story",
        "Tell it to friends with simple props",
        "Give friends praise and questions",
      ],
      skills: ["Speaking", "Vocabulary", "Confidence"],
      schedule: "Once a month",
      photos: [
        { image: { ...placeholderImages.levelKindy, alt: "Activity moments" }, caption: "" },
        { image: { ...placeholderImages.hero, alt: "Activity moments" }, caption: "" },
      ],
    },
    {
      slug: "book-day",
      name: "Book Day",
      summary: "Reading storybooks together, then retelling and discussing them.",
      audience: "All levels",
      image: { ...placeholderImages.activityBook, alt: "A boy writing in his notebook" },
      description:
        "Children read a picture book together, retell it in their own words and talk about its message.",
      highlights: [
        "Read a storybook with the tutor",
        "Retell it in their own words",
        "Talk about the characters and message",
      ],
      skills: ["Reading", "Listening", "Vocabulary"],
      schedule: "Every two months",
      photos: [
        { image: { ...placeholderImages.levelSecondary, alt: "Activity moments" }, caption: "" },
      ],
    },
    {
      slug: "market-day",
      name: "Market Day",
      summary: "A pretend market: children offer products and make deals in English.",
      audience: "All levels",
      image: {
        ...placeholderImages.activityMarket,
        alt: "Children working together at classroom tables",
      },
      description:
        "The classroom becomes a mini market. Children prepare goods, offer, bargain and count money, all in English.",
      highlights: [
        "Prepare products and price tags",
        "Offer and bargain in English",
        "Count money and change",
      ],
      skills: ["Speaking", "Numbers", "Teamwork"],
      schedule: "End of every term",
      photos: [
        { image: { ...placeholderImages.levelIntro, alt: "Activity moments" }, caption: "" },
      ],
    },
    {
      slug: "movie-day",
      name: "Movie Day",
      summary: "Watching an English kids' film, then quizzes and role-play from its scenes.",
      audience: "All levels",
      image: {
        ...placeholderImages.activityMovie,
        alt: "Children sitting on the classroom carpet raising their hands",
      },
      description:
        "Watch an English-language children's film together, then play a quiz and role-play favourite scenes so new words get used straight away.",
      highlights: [
        "Watch a tutor-picked children's film",
        "A fun quiz about the story",
        "Role-play favourite scenes",
      ],
      skills: ["Listening", "Speaking", "Vocabulary"],
      schedule: "Once a month",
      photos: [
        {
          image: { ...placeholderImages.activityStorytelling, alt: "Activity moments" },
          caption: "",
        },
      ],
    },
  ],
};
