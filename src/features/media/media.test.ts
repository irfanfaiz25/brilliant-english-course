import { describe, expect, it } from "vitest";

import { limits } from "@/config/limits";

import { displayName, uploadFileError, uploadFinishSchema, uploadKeyPattern } from "./schema";
import { assetKey, isBundledKey, newUploadKey } from "./storage-keys";

describe("upload checks", () => {
  const file = { name: "kelas.jpg", type: "image/jpeg", size: 1_000 };

  it("accepts JPEG, PNG and WebP up to the size limit", () => {
    expect(uploadFileError(file)).toBeNull();
    expect(uploadFileError({ ...file, type: "image/webp" })).toBeNull();
    expect(uploadFileError({ ...file, size: limits.media.maxUploadBytes })).toBeNull();
  });

  it("names the first problem", () => {
    expect(uploadFileError({ ...file, type: "image/gif" })).toBe("fileType");
    expect(uploadFileError({ ...file, type: "" })).toBe("fileType");
    expect(uploadFileError({ ...file, size: limits.media.maxUploadBytes + 1 })).toBe(
      "fileTooLarge",
    );
    expect(uploadFileError({ ...file, size: 0 })).toBe("fileEmpty");
  });

  it("only finishes uploads under tmp/", () => {
    const uploadId = newUploadKey();
    expect(uploadId).toMatch(uploadKeyPattern);
    expect(uploadFinishSchema.safeParse({ uploadId, name: "a" }).success).toBe(true);
    expect(
      uploadFinishSchema.safeParse({ uploadId: "media/2026/11/x.webp", name: "a" }).success,
    ).toBe(false);
    expect(uploadFinishSchema.safeParse({ uploadId: "tmp/../.env", name: "a" }).success).toBe(
      false,
    );
  });
});

describe("media names and keys", () => {
  it("turns a file name into a library name", () => {
    expect(displayName("Kelas_Kindy  2026.JPG")).toBe("Kelas Kindy 2026");
    expect(displayName(".png")).toBe("gambar");
    expect(displayName(`${"a".repeat(200)}.png`)).toHaveLength(limits.media.nameMax);
  });

  it("groups stored images by month and tells bundled placeholders apart", () => {
    expect(assetKey(new Date("2026-03-05T00:00:00Z"))).toMatch(
      /^media\/2026\/03\/[0-9a-f-]{36}\.webp$/,
    );
    expect(isBundledKey("/placeholders/level-kindy.webp")).toBe(true);
    expect(isBundledKey("media/2026/03/x.webp")).toBe(false);
  });
});
