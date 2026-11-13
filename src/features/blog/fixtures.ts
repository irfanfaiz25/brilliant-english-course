import { placeholderImages } from "@/config/placeholder-images";

import { bold, doc, h2, h3, italic, link, ol, p, quote, ul } from "./doc-builders";
import type { PostRecord } from "./schema";

const academicTeam = { name: "Tim Akademik BEC", role: "Kurikulum & Pelatihan" };
const partnershipTeam = { name: "Tim Kemitraan BEC", role: "Pendampingan Mitra" };

/**
 * PLACEHOLDER posts until the blog admin (Phase 4e). Written for review only; replace with
 * articles approved by BEC before launch. Newest first is not assumed — queries sort by date.
 */
export const postFixtures: PostRecord[] = [
  {
    id: "speak-at-home",
    category: "tips-belajar",
    cover: placeholderImages.hero,
    author: academicTeam,
    publishedAt: "2026-11-06",
    translations: {
      id: {
        slug: "cara-seru-anak-berbicara-bahasa-inggris-di-rumah",
        title: "7 Cara Seru Mengajak Anak Berbicara Bahasa Inggris di Rumah",
        excerpt:
          "Tidak perlu jadi guru untuk menemani anak berlatih. Tujuh kebiasaan kecil ini membuat bahasa Inggris terasa akrab setiap hari.",
        coverAlt: "Anak perempuan menulis di buku catatan",
        content: doc(
          p(
            "Anak belajar bahasa paling cepat saat bahasa itu ",
            bold("dipakai untuk hal yang mereka sukai"),
            ". Kabar baiknya, orang tua tidak perlu fasih untuk membantu — cukup konsisten dan santai.",
          ),
          h2("Mulai dari rutinitas harian"),
          p(
            "Pilih satu momen yang selalu terjadi, misalnya sarapan atau bersiap tidur, lalu jadikan momen itu “English time” selama lima menit.",
          ),
          ol(
            "Sebut nama benda di sekitar: spoon, plate, blanket.",
            "Tanyakan pilihan sederhana: “Milk or water?”",
            "Ucapkan kalimat yang sama setiap hari sampai anak ikut menirukan.",
          ),
          h2("Jadikan permainan, bukan pelajaran"),
          ul(
            [bold("Tebak benda: "), "“It's yellow and sweet. What is it?”"],
            [bold("Simon says: "), "melatih kata kerja sambil bergerak."],
            [bold("Lagu dan gerak: "), "anak kecil mengingat lewat irama."],
            [bold("Cerita bergambar: "), "biarkan anak menunjuk dan menyebut gambar."],
          ),
          quote(
            "Pujian untuk usaha lebih penting daripada koreksi. Anak yang merasa aman akan lebih berani mencoba.",
          ),
          h2("Kapan perlu bantuan kelas?"),
          p(
            "Latihan di rumah paling efektif bila didukung kelas yang terarah. Di BEC, anak belajar dalam kelompok kecil dengan kurikulum yang sama di setiap unit. ",
            link("Cari unit terdekat", "/cek-unit"),
            " untuk mencoba kelasnya.",
          ),
        ),
      },
      en: {
        slug: "fun-ways-to-get-kids-speaking-english-at-home",
        title: "7 Fun Ways to Get Kids Speaking English at Home",
        excerpt:
          "You don't need to be a teacher to help your child practise. These seven small habits make English feel familiar every day.",
        coverAlt: "A girl writing in a notebook",
        content: doc(
          p(
            "Children pick up a language fastest when it is ",
            bold("used for things they enjoy"),
            ". The good news: parents don't need to be fluent to help — just consistent and relaxed.",
          ),
          h2("Start with a daily routine"),
          p(
            "Pick one moment that always happens, such as breakfast or bedtime, and make it “English time” for five minutes.",
          ),
          ol(
            "Name the things around you: spoon, plate, blanket.",
            "Offer simple choices: “Milk or water?”",
            "Repeat the same sentences every day until your child joins in.",
          ),
          h2("Make it a game, not a lesson"),
          ul(
            [bold("Guess the object: "), "“It's yellow and sweet. What is it?”"],
            [bold("Simon says: "), "practise verbs while moving."],
            [bold("Songs and actions: "), "young children remember through rhythm."],
            [bold("Picture stories: "), "let your child point and name what they see."],
          ),
          quote(
            "Praise for effort matters more than correction. Children who feel safe are braver about trying.",
          ),
          h2("When does a class help?"),
          p(
            "Practice at home works best alongside structured classes. At BEC, children learn in small groups with the same curriculum in every unit. ",
            link("Find the nearest unit", "/en/find-a-unit"),
            " to try a class.",
          ),
        ),
      },
    },
  },
  {
    id: "shy-speakers",
    category: "parenting",
    cover: placeholderImages.levelKindy,
    author: academicTeam,
    publishedAt: "2026-10-28",
    translations: {
      id: {
        slug: "anak-malu-bicara-bahasa-inggris",
        title: "Anak Malu Bicara Bahasa Inggris? Ini yang Bisa Orang Tua Lakukan",
        excerpt:
          "Diam bukan berarti tidak paham. Kenali fase “silent period” dan cara lembut mendorong anak mulai berbicara.",
        coverAlt: "Anak-anak belajar bersama di kelas kecil",
        content: doc(
          p(
            "Banyak anak memahami jauh lebih banyak daripada yang mereka ucapkan. Fase ini disebut ",
            italic("silent period"),
            " dan wajar terjadi di awal belajar bahasa baru.",
          ),
          h2("Tanda anak sebenarnya sedang belajar"),
          ul(
            "Merespons instruksi sederhana walau menjawab dengan bahasa Indonesia.",
            "Ikut bersenandung saat lagu bahasa Inggris diputar.",
            "Menunjuk gambar yang tepat saat kata disebutkan.",
          ),
          h2("Yang sebaiknya dilakukan"),
          ol(
            [bold("Beri waktu. "), "Tunggu beberapa detik sebelum membantu menjawab."],
            [bold("Contohkan, jangan menuntut. "), "Ulangi jawaban yang benar dengan nada santai."],
            [bold("Rayakan langkah kecil. "), "Satu kata baru pun layak dipuji."],
          ),
          h3("Yang sebaiknya dihindari"),
          p(
            "Hindari menyuruh anak “ngomong bahasa Inggris dong” di depan banyak orang. Tekanan sosial justru memperpanjang fase diam.",
          ),
          quote("Kelas kecil membantu anak pemalu karena setiap anak mendapat giliran yang aman."),
        ),
      },
      en: {
        slug: "child-shy-about-speaking-english",
        title: "Is Your Child Shy About Speaking English? Here's How to Help",
        excerpt:
          "Quiet doesn't mean lost. Learn about the “silent period” and gentle ways to encourage your child to start speaking.",
        coverAlt: "Children learning together in a small class",
        content: doc(
          p(
            "Many children understand far more than they say. This stage is called the ",
            italic("silent period"),
            " and it is normal at the start of learning a new language.",
          ),
          h2("Signs your child is actually learning"),
          ul(
            "Responds to simple instructions, even if answering in Indonesian.",
            "Hums along when English songs are playing.",
            "Points to the right picture when a word is said.",
          ),
          h2("What helps"),
          ol(
            [bold("Give time. "), "Wait a few seconds before helping with an answer."],
            [bold("Model, don't demand. "), "Repeat the right answer in a relaxed tone."],
            [bold("Celebrate small steps. "), "Even one new word deserves praise."],
          ),
          h3("What to avoid"),
          p(
            "Avoid asking your child to “say something in English” in front of others. Social pressure only makes the quiet stage longer.",
          ),
          quote("Small classes help shy children because everyone gets a safe turn."),
        ),
      },
    },
  },
  {
    id: "market-day",
    category: "kegiatan",
    cover: placeholderImages.activityMarket,
    author: academicTeam,
    publishedAt: "2026-10-15",
    translations: {
      id: {
        slug: "serunya-market-day-belajar-sambil-berjualan",
        title: "Serunya Market Day: Belajar Bahasa Inggris Sambil Berjualan",
        excerpt:
          "Di Market Day, siswa menawarkan dagangan, menghitung uang, dan bernegosiasi — semuanya dalam bahasa Inggris.",
        coverAlt: "Siswa berjualan di stan Market Day",
        content: doc(
          p(
            "Market Day adalah kegiatan rutin di unit BEC. Kelas berubah menjadi pasar kecil, dan setiap siswa punya peran: penjual, pembeli, atau kasir.",
          ),
          h2("Apa yang dilatih?"),
          ul(
            "Kosakata benda, angka, dan harga.",
            "Kalimat tanya dan menawar: “How much is it?”",
            "Keberanian berbicara dengan teman dan orang tua yang berkunjung.",
          ),
          h2("Persiapan bersama orang tua"),
          p(
            "Orang tua bisa membantu anak menyiapkan barang sederhana dan berlatih kalimat penawaran di rumah. Yang penting bukan barangnya, tapi keberanian anak memakai bahasa Inggris.",
          ),
          quote("“Aku jualan kue dan semuanya habis! Aku bilang ‘Thank you, come again!’”"),
          p(
            "Jadwal Market Day berbeda di tiap unit. ",
            link("Cek unit terdekat", "/cek-unit"),
            ".",
          ),
        ),
      },
      en: {
        slug: "market-day-learning-english-by-running-a-stall",
        title: "Market Day: Learning English by Running a Stall",
        excerpt:
          "On Market Day, students sell their goods, count money and haggle — all in English.",
        coverAlt: "Students running a Market Day stall",
        content: doc(
          p(
            "Market Day is a regular activity at BEC units. The class turns into a small market and every student has a role: seller, buyer or cashier.",
          ),
          h2("What do children practise?"),
          ul(
            "Words for things, numbers and prices.",
            "Questions and bargaining: “How much is it?”",
            "Confidence to talk with friends and visiting parents.",
          ),
          h2("Preparing together with parents"),
          p(
            "Parents can help their child prepare simple items and practise selling phrases at home. What matters isn't the product but the courage to use English.",
          ),
          quote("“I sold cakes and they were all gone! I said ‘Thank you, come again!’”"),
          p(
            "Market Day schedules differ per unit. ",
            link("Find the nearest unit", "/en/find-a-unit"),
            ".",
          ),
        ),
      },
    },
  },
  {
    id: "best-age",
    category: "tips-belajar",
    cover: placeholderImages.levelIntro,
    author: academicTeam,
    publishedAt: "2026-10-02",
    translations: {
      id: {
        slug: "usia-terbaik-anak-mulai-belajar-bahasa-inggris",
        title: "Usia Berapa Anak Sebaiknya Mulai Belajar Bahasa Inggris?",
        excerpt:
          "Lebih awal memang membantu, tapi caranya harus sesuai usia. Begini gambaran belajar yang pas dari 4 sampai 15 tahun.",
        coverAlt: "Anak-anak sekolah dasar mengangkat tangan di kelas",
        content: doc(
          p(
            "Tidak ada kata terlambat untuk belajar bahasa Inggris, tetapi ",
            bold("cara belajar yang tepat berbeda di setiap usia"),
            ".",
          ),
          h2("4–6 tahun: bermain dan mendengar"),
          p(
            "Anak usia dini belajar lewat lagu, gerak, dan gambar. Targetnya adalah akrab dengan bunyi bahasa, bukan menulis.",
          ),
          h2("7–9 tahun: membangun dasar"),
          p(
            "Anak mulai siap membaca kata sederhana, menyusun kalimat pendek, dan berbicara dalam percakapan sehari-hari.",
          ),
          h2("10–15 tahun: percaya diri dan akademik"),
          p(
            "Remaja melatih tata bahasa, menulis, dan presentasi — sekaligus menyiapkan diri untuk pelajaran di sekolah.",
          ),
          p(
            "Program BEC mengikuti tahapan ini lewat level Kindy, Intro, dan Secondary. ",
            link("Lihat detail program", "/program"),
            ".",
          ),
        ),
      },
      en: {
        slug: "what-age-should-children-start-learning-english",
        title: "What Age Should Children Start Learning English?",
        excerpt:
          "Starting early helps, but the method must fit the age. Here is what good learning looks like from 4 to 15.",
        coverAlt: "Primary school children raising their hands in class",
        content: doc(
          p(
            "It is never too late to learn English, but ",
            bold("the right way to learn differs at every age"),
            ".",
          ),
          h2("Ages 4–6: play and listen"),
          p(
            "Young children learn through songs, movement and pictures. The goal is getting familiar with the sounds of the language, not writing.",
          ),
          h2("Ages 7–9: build the basics"),
          p(
            "Children become ready to read simple words, build short sentences and hold everyday conversations.",
          ),
          h2("Ages 10–15: confidence and school skills"),
          p(
            "Teenagers practise grammar, writing and presenting — while preparing for English at school.",
          ),
          p(
            "BEC programs follow these stages with the Kindy, Intro and Secondary levels. ",
            link("See the programs", "/en/programs"),
            ".",
          ),
        ),
      },
    },
  },
  {
    id: "unit-at-home",
    category: "kemitraan",
    cover: placeholderImages.activityBook,
    author: partnershipTeam,
    publishedAt: "2026-09-18",
    translations: {
      id: {
        slug: "membuka-unit-kursus-di-rumah",
        title: "Membuka Unit Kursus di Rumah: Yang Perlu Disiapkan",
        excerpt:
          "Ruang yang nyaman, waktu yang konsisten, dan semangat mendampingi anak. Ini daftar persiapan sebelum membuka unit BEC.",
        coverAlt: "Buku dan alat tulis di meja belajar",
        content: doc(
          p(
            "Banyak mitra BEC memulai dari ruang tamu. Yang dibutuhkan bukan gedung besar, melainkan ruang yang aman dan nyaman untuk kelas kecil.",
          ),
          h2("Ruang belajar"),
          ul(
            "Cukup untuk 8–10 anak duduk melingkar atau berkelompok.",
            "Pencahayaan baik dan sirkulasi udara lancar.",
            "Dinding untuk menempel hasil karya dan poster kosakata.",
          ),
          h2("Waktu dan komitmen"),
          p(
            "Kelas biasanya berlangsung sore hari. Pastikan kamu bisa menjaga jadwal tetap, karena konsistensi adalah alasan orang tua bertahan.",
          ),
          h2("Langkah berikutnya"),
          ol(
            "Cek kuota desa tempat unitmu akan dibuka.",
            "Isi formulir pendaftaran mitra.",
            "Konsultasi dan survei bersama tim kemitraan.",
          ),
          p(link("Cek kuota desamu sekarang", "/kemitraan#kuota"), " — maksimal 2 unit per desa."),
        ),
      },
      en: {
        slug: "opening-a-course-unit-at-home",
        title: "Opening a Course Unit at Home: What to Prepare",
        excerpt:
          "A comfortable room, a steady schedule and a love for teaching children. Your checklist before opening a BEC unit.",
        coverAlt: "Books and stationery on a study desk",
        content: doc(
          p(
            "Many BEC partners start in their living room. You don't need a big building — just a safe, comfortable space for a small class.",
          ),
          h2("The learning space"),
          ul(
            "Room for 8–10 children to sit in a circle or in groups.",
            "Good lighting and fresh air.",
            "A wall to display work and vocabulary posters.",
          ),
          h2("Time and commitment"),
          p(
            "Classes usually run in the afternoon. Make sure you can keep a steady schedule — consistency is why parents stay.",
          ),
          h2("Next steps"),
          ol(
            "Check the quota of the village where your unit will open.",
            "Fill in the partner application form.",
            "Consultation and a site visit with the partnership team.",
          ),
          p(
            link("Check your village quota now", "/en/partnership#kuota"),
            " — at most 2 units per village.",
          ),
        ),
      },
    },
  },
  {
    id: "story-telling-day",
    category: "kegiatan",
    cover: placeholderImages.activityStorytelling,
    author: academicTeam,
    publishedAt: "2026-09-04",
    translations: {
      id: {
        slug: "story-telling-day-melatih-percaya-diri",
        title: "Story Telling Day: Melatih Percaya Diri Lewat Cerita",
        excerpt:
          "Bercerita di depan teman melatih kosakata, pelafalan, dan keberanian. Begini cara kami menyiapkan anak untuk tampil.",
        coverAlt: "Guru bercerita di depan kelas",
        content: doc(
          p(
            "Story Telling Day memberi setiap anak panggung kecil. Mereka memilih cerita, berlatih, lalu tampil di depan teman dan orang tua.",
          ),
          h2("Tahapan persiapan"),
          ol(
            "Memilih cerita pendek sesuai level.",
            "Berlatih bersama pengajar dalam kelompok kecil.",
            "Gladi bersih dengan properti sederhana.",
          ),
          h2("Manfaatnya untuk anak"),
          ul(
            "Kosakata dan pelafalan meningkat lewat pengulangan.",
            "Anak belajar mengatur suara dan ekspresi.",
            "Rasa percaya diri tumbuh setelah berhasil tampil.",
          ),
          quote(
            "Tepuk tangan teman-teman adalah hadiah terbaik untuk anak yang baru pertama kali tampil.",
          ),
        ),
      },
      en: {
        slug: "story-telling-day-building-confidence",
        title: "Story Telling Day: Building Confidence Through Stories",
        excerpt:
          "Telling a story to friends builds vocabulary, pronunciation and courage. Here is how we help children get ready to perform.",
        coverAlt: "A teacher telling a story to the class",
        content: doc(
          p(
            "Story Telling Day gives every child a small stage. They choose a story, practise, then perform for friends and parents.",
          ),
          h2("How we prepare"),
          ol(
            "Choose a short story that fits the level.",
            "Practise with the teacher in small groups.",
            "A dress rehearsal with simple props.",
          ),
          h2("Why it helps"),
          ul(
            "Vocabulary and pronunciation improve through repetition.",
            "Children learn to use their voice and expressions.",
            "Confidence grows after a successful performance.",
          ),
          quote(
            "Applause from friends is the best reward for a child performing for the first time.",
          ),
        ),
      },
    },
  },
  {
    id: "screen-time",
    category: "parenting",
    cover: placeholderImages.activityMovie,
    author: academicTeam,
    publishedAt: "2026-08-21",
    translations: {
      id: {
        slug: "screen-time-bermanfaat-film-dan-lagu-bahasa-inggris",
        title: "Screen Time yang Bermanfaat: Film dan Lagu Bahasa Inggris untuk Anak",
        excerpt:
          "Layar bisa jadi teman belajar bila dipilih dan ditemani. Panduan singkat memilih tontonan berbahasa Inggris.",
        coverAlt: "Anak-anak menonton film bersama",
        content: doc(
          p(
            "Tontonan berbahasa Inggris melatih pendengaran anak. Kuncinya: pilih yang sesuai usia dan tonton bersama bila memungkinkan.",
          ),
          h2("Memilih tontonan"),
          ul(
            "Durasi pendek dengan bahasa yang jelas dan diulang-ulang.",
            "Lagu dengan gerakan untuk anak usia dini.",
            "Subtitle bahasa Inggris untuk anak yang sudah bisa membaca.",
          ),
          h2("Menonton secara aktif"),
          p(
            "Hentikan sejenak dan tanyakan, “What is he doing?” atau “What color is it?” Pertanyaan kecil mengubah menonton menjadi latihan.",
          ),
          quote("Batasi waktu layar dan seimbangkan dengan bermain serta membaca bersama."),
        ),
      },
      en: {
        slug: "screen-time-that-helps-english-films-and-songs",
        title: "Screen Time That Helps: English Films and Songs for Kids",
        excerpt:
          "Screens can support learning when chosen well and watched together. A short guide to picking English content.",
        coverAlt: "Children watching a film together",
        content: doc(
          p(
            "English shows train children's listening. The key: choose age-appropriate content and watch together when you can.",
          ),
          h2("Choosing what to watch"),
          ul(
            "Short episodes with clear, repeated language.",
            "Action songs for young children.",
            "English subtitles for children who can already read.",
          ),
          h2("Watching actively"),
          p(
            "Pause and ask, “What is he doing?” or “What color is it?” Small questions turn watching into practice.",
          ),
          quote("Limit screen time and balance it with play and reading together."),
        ),
      },
    },
  },
  {
    id: "teen-exams",
    category: "tips-belajar",
    cover: placeholderImages.levelSecondary,
    author: academicTeam,
    publishedAt: "2026-08-07",
    translations: {
      id: {
        slug: "menyiapkan-remaja-ujian-bahasa-inggris-sekolah",
        title: "Menyiapkan Remaja Menghadapi Ujian Bahasa Inggris Sekolah",
        excerpt:
          "Belajar sedikit tapi rutin lebih efektif daripada belajar semalam suntuk. Strategi praktis untuk siswa SMP.",
        coverAlt: "Remaja belajar bersama dengan laptop",
        content: doc(
          p(
            "Ujian bahasa Inggris di sekolah menguji membaca, tata bahasa, dan menulis. Persiapan terbaik dimulai beberapa minggu sebelumnya.",
          ),
          h2("Strategi empat minggu"),
          ol(
            [bold("Minggu 1: "), "kumpulkan materi dan kosakata dari buku sekolah."],
            [bold("Minggu 2: "), "latihan membaca teks pendek setiap hari."],
            [bold("Minggu 3: "), "ulang tata bahasa yang sering keluar."],
            [bold("Minggu 4: "), "kerjakan soal latihan dengan batas waktu."],
          ),
          h2("Peran orang tua"),
          p(
            "Bantu anak menyusun jadwal dan sediakan tempat belajar yang tenang. Tanyakan apa yang sudah dipelajari, bukan hanya nilainya.",
          ),
        ),
      },
      en: {
        slug: "helping-teens-prepare-for-school-english-exams",
        title: "Helping Teens Prepare for School English Exams",
        excerpt:
          "A little practice every day beats an all-nighter. Practical strategies for junior high students.",
        coverAlt: "Teenagers studying together with a laptop",
        content: doc(
          p(
            "School English exams test reading, grammar and writing. The best preparation starts a few weeks ahead.",
          ),
          h2("A four-week plan"),
          ol(
            [bold("Week 1: "), "gather materials and vocabulary from the school book."],
            [bold("Week 2: "), "read a short text every day."],
            [bold("Week 3: "), "review the grammar that comes up most."],
            [bold("Week 4: "), "do practice tests with a time limit."],
          ),
          h2("How parents can help"),
          p(
            "Help your child plan a schedule and keep a quiet place to study. Ask what they learned, not just about the score.",
          ),
        ),
      },
    },
  },
];
