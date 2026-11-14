import { createHmac, timingSafeEqual } from "node:crypto";

/** What a signed local upload URL allows: one object, one content type, until `expiresAt`. */
export type UploadGrant = { key: string; contentType: string; expiresAt: number };

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(`upload:${payload}`).digest("base64url");

/**
 * Token of the local storage driver's upload URL: the local counterpart of an R2 presigned URL
 * (`payload.signature`, both base64url). Holding it is the permission to write that one object.
 */
export function signUploadToken(grant: UploadGrant, secret: string): string {
  const payload = Buffer.from(JSON.stringify(grant)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** The grant of a valid, unexpired token, or `null`. */
export function verifyUploadToken(
  token: string,
  secret: string,
  now = Date.now(),
): UploadGrant | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const grant: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof grant === "object" &&
      grant !== null &&
      "key" in grant &&
      "contentType" in grant &&
      "expiresAt" in grant &&
      typeof grant.key === "string" &&
      typeof grant.contentType === "string" &&
      typeof grant.expiresAt === "number" &&
      grant.expiresAt > now
    ) {
      return { key: grant.key, contentType: grant.contentType, expiresAt: grant.expiresAt };
    }
  } catch {
    // Not JSON: treated like a bad signature.
  }
  return null;
}
