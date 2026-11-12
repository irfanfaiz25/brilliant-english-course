import { z } from "zod";

/**
 * Public (browser-safe) environment, inlined by Next.js at build time.
 * Each variable must be referenced literally (`process.env.NEXT_PUBLIC_X`) so Next.js can inline it.
 */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export const publicEnv: PublicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
