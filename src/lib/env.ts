import { z } from "zod";

/**
 * Server environment, validated once at startup.
 *
 * This is the only module allowed to read `process.env` for server values. It is safe to import
 * from Next.js server code, the worker and scripts. Browser code must use `public-env.ts`.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment variables:\n${issues}`);
  }
  return result.data;
}

if (typeof window !== "undefined") {
  throw new Error("`@/lib/env` was imported in the browser. Use `@/lib/public-env` instead.");
}

export const env = parseServerEnv(process.env);
