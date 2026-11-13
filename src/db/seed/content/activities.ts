import { placeholderImages } from "@/config/placeholder-images";
import type { Locale } from "@/i18n/routing";

import type { Activity } from "@/features/activities/schema";

/** PLACEHOLDER content from the Penpot design until the activities admin module (Phase 4b). */
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
    },
    {
      slug: "book-day",
      name: "Book Day",
      summary: "Reading storybooks together, then retelling and discussing them.",
      audience: "All levels",
      image: { ...placeholderImages.activityBook, alt: "A boy writing in his notebook" },
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
    },
  ],
};
