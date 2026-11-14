import { describe, expect, it } from "vitest";

import { signUploadToken, verifyUploadToken } from "./upload-token";

const secret = "test-secret-that-is-at-least-32-characters";
const grant = { key: "tmp/abc", contentType: "image/png", expiresAt: 2_000 };

describe("upload tokens", () => {
  it("round-trips a grant until it expires", () => {
    const token = signUploadToken(grant, secret);
    expect(verifyUploadToken(token, secret, 1_000)).toEqual(grant);
    expect(verifyUploadToken(token, secret, 2_000)).toBeNull();
  });

  it("rejects another secret, a changed payload and malformed tokens", () => {
    const token = signUploadToken(grant, secret);
    expect(verifyUploadToken(token, `${secret}-other`, 1_000)).toBeNull();
    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...grant, key: "media/x.webp" })).toString(
      "base64url",
    );
    expect(verifyUploadToken(`${forged}.${signature}`, secret, 1_000)).toBeNull();
    expect(verifyUploadToken("", secret, 1_000)).toBeNull();
    expect(verifyUploadToken(`${token}.extra`, secret, 1_000)).toBeNull();
  });
});
