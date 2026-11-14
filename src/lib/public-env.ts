import { z } from "zod";

/**
 * Public (browser-safe) environment, inlined by Next.js at build time.
 * Each variable must be referenced literally (`process.env.NEXT_PUBLIC_X`) so Next.js can inline it.
 */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  /** Public URL of the R2 media bucket; unset when uploads are stored locally (`/api/media/files`). */
  NEXT_PUBLIC_MEDIA_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url().optional(),
  ),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export const publicEnv: PublicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_MEDIA_URL: process.env.NEXT_PUBLIC_MEDIA_URL,
});
