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
  blog: {
    /** Cards per page on the blog index (the featured post on page 1 is extra). */
    pageSize: 6,
    relatedPosts: 3,
    /** Average reading speed used for "x min read". */
    wordsPerMinute: 200,
  },
} as const;
