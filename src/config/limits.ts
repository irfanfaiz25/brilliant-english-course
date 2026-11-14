/**
 * Business and abuse limits used as code defaults. Values admins can tune (quota rules) move to
 * the `settings` domain in Phase 4 and fall back to these.
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
  activities: {
    nameMax: 80,
    summaryMax: 300,
    audienceMax: 60,
  },
  /** Alt text of a content image (localized, stored with the content). */
  imageAltMax: 200,
  seo: {
    /** Search results cut titles and descriptions around these lengths. */
    titleMax: 70,
    descriptionMin: 50,
    descriptionMax: 160,
  },
  blog: {
    /** Cards per page on the blog index (the featured post on page 1 is extra). */
    pageSize: 6,
    relatedPosts: 3,
    /** Average reading speed used for "x min read". */
    wordsPerMinute: 200,
  },
} as const;
