import { z } from "zod";

import { imageSchema } from "@/lib/schemas";

/** A recurring unit activity (Story Telling Day, …), resolved to one locale. */
export const activitySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  /** Short audience label, e.g. "Semua level". */
  audience: z.string().min(1),
  image: imageSchema,
});

export type Activity = z.infer<typeof activitySchema>;
