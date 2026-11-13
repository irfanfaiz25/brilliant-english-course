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
} as const;
