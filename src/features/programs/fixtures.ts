import { placeholderImages } from "@/config/placeholder-images";
import type { Locale } from "@/i18n/routing";

import type { Level } from "./schema";

/**
 * PLACEHOLDER content from the Penpot design, used by `queries.ts` until the programs table
 * and admin module exist (Phases 3–4b). Shape matches what the database will return.
 */
export const levelFixtures: Record<Locale, Level[]> = {
  id: [
    {
      slug: "kindy",
      name: "Kindy",
      ageMin: 4,
      ageMax: 6,
      tagline: "Kenalan dengan Bahasa Inggris",
      summary:
        "Kenal huruf, kosakata dasar, lagu dan permainan. Anak mulai berani bicara bahasa Inggris dengan cara yang menyenangkan.",
      skills: ["Phonics & vocabulary", "Songs & games", "Simple greetings"],
      image: {
        ...placeholderImages.levelKindy,
        alt: "Anak-anak duduk di lantai kelas mendengarkan cerita",
      },
    },
    {
      slug: "intro",
      name: "Intro",
      ageMin: 7,
      ageMax: 9,
      tagline: "Mulai Bercakap dan Membaca",
      summary: "Kalimat sederhana, membaca cerita pendek, dan percakapan sehari-hari di kelas.",
      skills: ["Basic grammar", "Reading & story", "Daily conversation"],
      image: {
        ...placeholderImages.levelIntro,
        alt: "Anak-anak mengangkat tangan dengan antusias di kelas",
      },
    },
    {
      slug: "secondary",
      name: "Secondary",
      ageMin: 10,
      ageMax: 15,
      tagline: "Lancar Bicara, Kuat Grammar",
      summary: "Grammar lebih dalam, menulis paragraf, presentasi, dan persiapan ujian sekolah.",
      skills: ["Grammar & writing", "Presentation", "School exam prep"],
      image: {
        ...placeholderImages.levelSecondary,
        alt: "Siswa mengangkat tangan menjawab pertanyaan guru",
      },
    },
  ],
  en: [
    {
      slug: "kindy",
      name: "Kindy",
      ageMin: 4,
      ageMax: 6,
      tagline: "First Steps in English",
      summary:
        "Letters, first words, songs and games. Children start speaking English with confidence, the fun way.",
      skills: ["Phonics & vocabulary", "Songs & games", "Simple greetings"],
      image: {
        ...placeholderImages.levelKindy,
        alt: "Children sitting on the classroom floor listening to a story",
      },
    },
    {
      slug: "intro",
      name: "Intro",
      ageMin: 7,
      ageMax: 9,
      tagline: "Start Talking and Reading",
      summary: "Simple sentences, short stories and everyday conversation in class.",
      skills: ["Basic grammar", "Reading & story", "Daily conversation"],
      image: {
        ...placeholderImages.levelIntro,
        alt: "Children eagerly raising their hands in class",
      },
    },
    {
      slug: "secondary",
      name: "Secondary",
      ageMin: 10,
      ageMax: 15,
      tagline: "Fluent Speaking, Strong Grammar",
      summary: "Deeper grammar, paragraph writing, presentations and school exam preparation.",
      skills: ["Grammar & writing", "Presentation", "School exam prep"],
      image: {
        ...placeholderImages.levelSecondary,
        alt: "Students raising their hands to answer the teacher",
      },
    },
  ],
};
