/**
 * Business and abuse limits used as code defaults. Values admins tune (the quota rules) live in
 * the `settings` table and fall back to these.
 */
export const limits = {
  /** Partner units allowed per village (desa/kelurahan), active and in onboarding together. */
  unitsPerVillage: 2,
  /** Village quota at or below this many open slots is shown as "almost full". */
  quotaAlmostFullAt: 1,
  partnerApplication: {
    nameMax: 80,
    motivationMax: 500,
    /** Submissions allowed per IP address within `rateWindowMs`. */
    rateLimit: 5,
    rateWindowMs: 10 * 60 * 1000,
  },
  auth: {
    passwordMin: 10,
    passwordMax: 128,
    /** Signed-in sessions last this long; each visit after a day extends them again. */
    sessionDays: 7,
    resetLinkMinutes: 60,
    /** Sign-in attempts per IP and per email within `signInWindowMs`. */
    signInRateLimit: 10,
    signInWindowMs: 15 * 60 * 1000,
    /** Password-reset requests per IP and per email within `resetWindowMs`. */
    resetRateLimit: 5,
    resetWindowMs: 60 * 60 * 1000,
  },
  settings: {
    addressMax: 200,
    /** Rows in the office-hours editor (one per group of days). */
    officeHoursMax: 7,
    inclusionsMin: 3,
    inclusionsMax: 10,
    inclusionMax: 120,
  },
  programs: {
    ageMin: 3,
    ageMax: 18,
    sessionsPerWeekMax: 7,
    studentsPerClassMax: 30,
    nameMax: 80,
    taglineMax: 120,
    summaryMax: 300,
    descriptionMax: 1200,
    skillsMax: 5,
    skillMax: 60,
    curriculumMax: 8,
    curriculumItemMax: 120,
  },
  quota: {
    /** Upper bound of the per-village maximum an admin can set. */
    unitsPerVillageMax: 10,
    reservationSlotsMax: 10,
    reservationNoteMax: 200,
  },
  leads: {
    noteMax: 2000,
    /** Rows per page of the admin lead list. */
    pageSize: 20,
    /** Rows a CSV export may hold; narrow the filter for more. */
    exportMax: 5000,
  },
  units: {
    nameMax: 120,
    slugMax: 80,
    addressMax: 300,
    managerMax: 120,
    studentsMax: 5000,
    /** Indonesia's bounding box, to catch swapped or mistyped coordinates. */
    latitude: { min: -11.5, max: 6.5 },
    longitude: { min: 94.5, max: 141.5 },
    /** Rows per page of the admin unit list. */
    pageSize: 20,
  },
  activities: {
    nameMax: 80,
    summaryMax: 300,
    audienceMax: 60,
  },
  testimonials: {
    /** Matches `testimonials.author_name` / `testimonial_translations.role` (varchar 120). */
    authorMax: 120,
    roleMax: 120,
    quoteMin: 20,
    /** Keeps cards of one row at a similar height. */
    quoteMax: 400,
  },
  faq: {
    /** Matches `faq_item_translations.question` (varchar 200). */
    questionMin: 10,
    questionMax: 200,
    answerMin: 20,
    answerMax: 1200,
  },
  /** Alt text of a content image (localized, stored with the content). */
  imageAltMax: 200,
  media: {
    /** Largest file accepted for upload, before processing. */
    maxUploadBytes: 5 * 1024 * 1024,
    /** Longest side after processing; larger images are scaled down, smaller ones kept. */
    maxDimension: 2400,
    /** WebP quality of stored images. */
    webpQuality: 82,
    /** Files one upload batch may hold. */
    maxFilesPerBatch: 10,
    /** Minutes a signed upload URL stays valid. */
    uploadUrlMinutes: 10,
    /** Display name (the original file name, editable later). */
    nameMax: 120,
    /** Images per page of the media library. */
    pageSize: 24,
  },
  seo: {
    /** Search results cut titles and descriptions around these lengths. */
    titleMax: 70,
    descriptionMin: 50,
    descriptionMax: 160,
  },
  blog: {
    /** Cards per page on the blog index (the featured post on page 1 is extra). */
    pageSize: 6,
    /** Rows per page of the admin article list. */
    adminPageSize: 20,
    titleMin: 5,
    titleMax: 110,
    slugMax: 160,
    excerptMin: 20,
    excerptMax: 200,
    authorMax: 120,
    relatedPosts: 3,
    /** Average reading speed used for "x min read". */
    wordsPerMinute: 200,
  },
} as const;
