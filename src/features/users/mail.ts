import { env } from "@/lib/env";

type PasswordResetMail = { email: string; name: string; url: string };

/**
 * Delivers a password-reset link. PLACEHOLDER until the email channel exists (Phase 6, ADR-007):
 * outside production the link is printed to the server console so it can be opened locally; in
 * production nothing is sent and only a warning without the link is logged, because the URL is a
 * credential. Until then a super admin can reset staff passwords with `pnpm auth:create-user`.
 */
export async function sendPasswordResetMail({
  email,
  name,
  url,
}: PasswordResetMail): Promise<void> {
  if (env.NODE_ENV !== "production") {
    console.info(`[auth] Password reset link for ${name} <${email}>: ${url}`);
    return;
  }
  console.warn(`[auth] Password reset requested for ${email}, but email delivery is not set up.`);
}
