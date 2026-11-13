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
      description:
        "Anak dikenalkan pada bunyi huruf, kosakata sehari-hari, dan ungkapan sederhana lewat lagu, gambar, dan permainan. Tujuannya: anak senang dan berani bicara.",
      curriculum: [
        "Phonics & huruf",
        "Kosakata: warna, angka, hewan, keluarga",
        "Greetings & instruksi kelas",
        "Lagu, games, dan story time",
      ],
      sessionsPerWeek: 2,
      maxStudentsPerClass: 10,
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
      description:
        "Anak belajar menyusun kalimat sederhana, membaca cerita pendek, dan bercakap tentang kegiatan sehari-hari. Grammar dasar dikenalkan lewat contoh, bukan hafalan.",
      curriculum: [
        "Simple present & past",
        "Membaca cerita pendek",
        "Daily conversation",
        "Menulis kalimat sederhana",
      ],
      sessionsPerWeek: 2,
      maxStudentsPerClass: 10,
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
      description:
        "Grammar lebih lengkap, menulis paragraf, presentasi, dan diskusi. Cocok untuk pendamping pelajaran bahasa Inggris di sekolah dan persiapan ujian.",
      curriculum: [
        "Tenses & sentence structure",
        "Writing paragraf",
        "Presentation & discussion",
        "Persiapan ujian sekolah",
      ],
      sessionsPerWeek: 2,
      maxStudentsPerClass: 10,
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
      description:
        "Children meet letter sounds, everyday words and simple phrases through songs, pictures and games. The goal: kids who enjoy English and dare to speak it.",
      curriculum: [
        "Phonics & letters",
        "Words: colours, numbers, animals, family",
        "Greetings & classroom instructions",
        "Songs, games and story time",
      ],
      sessionsPerWeek: 2,
      maxStudentsPerClass: 10,
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
      description:
        "Children learn to build simple sentences, read short stories and talk about daily activities. Basic grammar is taught through examples, not memorising.",
      curriculum: [
        "Simple present & past",
        "Reading short stories",
        "Daily conversation",
        "Writing simple sentences",
      ],
      sessionsPerWeek: 2,
      maxStudentsPerClass: 10,
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
      description:
        "Fuller grammar, paragraph writing, presentations and discussions. A great companion to school English lessons and exam preparation.",
      curriculum: [
        "Tenses & sentence structure",
        "Paragraph writing",
        "Presentation & discussion",
        "School exam preparation",
      ],
      sessionsPerWeek: 2,
      maxStudentsPerClass: 10,
      image: {
        ...placeholderImages.levelSecondary,
        alt: "Students raising their hands to answer the teacher",
      },
    },
  ],
};
