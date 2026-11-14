import { z } from "zod";

/** An optional value where an empty string (`R2_BUCKET=` in an env file) means "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const r2Keys = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"] as const;

/**
 * Server environment, validated once at startup.
 *
 * This is the only module allowed to read `process.env` for server values. It is safe to import
 * from Next.js server code, the worker and scripts. Browser code must use `public-env.ts`.
 */
export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    /** Signs session cookies and tokens. Generate with `openssl rand -base64 32`; rotate = sign-out all. */
    BETTER_AUTH_SECRET: z.string().min(32),
    /** Set by CI runners; lets the dev seed write to CI's throwaway database. */
    CI: z.stringbool().optional(),
    /** Serves the internal `/design-system` preview. Defaults to on outside production. */
    ENABLE_DESIGN_PREVIEW: z.stringbool().optional(),
    /**
     * Cloudflare R2 for uploaded media (ADR-031): all four or none. Without them uploads go to the
     * git-ignored `.storage/` folder (local development and CI).
     */
    R2_ACCOUNT_ID: optional(z.string()),
    R2_ACCESS_KEY_ID: optional(z.string()),
    R2_SECRET_ACCESS_KEY: optional(z.string()),
    R2_BUCKET: optional(z.string()),
    /** Public URL of the media bucket (custom domain); required with R2. Read here to validate it. */
    NEXT_PUBLIC_MEDIA_URL: optional(z.url({ protocol: /^https?$/ })),
  })
  .superRefine((value, ctx) => {
    const set = r2Keys.filter((key) => value[key] !== undefined);
    if (set.length > 0 && set.length < r2Keys.length) {
      for (const key of r2Keys.filter((key) => value[key] === undefined)) {
        ctx.addIssue({ code: "custom", path: [key], message: "Set all R2_* variables or none." });
      }
    }
    if (set.length === r2Keys.length && !value.NEXT_PUBLIC_MEDIA_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_MEDIA_URL"],
        message: "Required with R2: the bucket's public URL.",
      });
    }
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
