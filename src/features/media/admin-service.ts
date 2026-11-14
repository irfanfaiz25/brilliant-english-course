import "server-only";

import { eq } from "drizzle-orm";
import sharp, { type OutputInfo } from "sharp";

import { limits } from "@/config/limits";
import { db } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";
import { storage, type UploadTarget } from "@/lib/storage";

import type { MediaRename, UploadFinish, UploadStart } from "./schema";
import { displayName } from "./schema";
import { mediaUrl } from "./service";
import { assetKey, isBundledKey, newUploadKey } from "./storage-keys";
import { usageCount } from "./usage";

/** A just-uploaded image, as the upload queue and the media picker show it. */
export type UploadedMedia = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
};

/**
 * First step of an upload: a key for the raw file and a short-lived URL the browser PUTs it to
 * (R2 presigned or the local driver's signed route), so the file never passes through a Server
 * Action and the browser can report real progress.
 */
export async function startUpload(file: UploadStart): Promise<UploadTarget & { uploadId: string }> {
  const uploadId = newUploadKey();
  return { uploadId, ...(await storage.uploadTarget(uploadId, file.type)) };
}

/**
 * Second step: reads the raw upload, turns it into a WebP no larger than `maxDimension` (rotated
 * upright, metadata stripped), stores it under its final key and adds the library row. The raw
 * file is removed either way.
 */
export async function finishUpload(
  { uploadId, name }: UploadFinish,
  actorId: string,
): Promise<UploadedMedia> {
  const raw = await storage.read(uploadId, limits.media.maxUploadBytes);
  if (!raw) {
    // Missing, or larger than allowed (an upload URL does not enforce the size).
    await storage.remove(uploadId);
    throw new ActionFailure("uploadMissing");
  }

  let image: { data: Buffer; info: OutputInfo };
  try {
    image = await sharp(raw, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({
        width: limits.media.maxDimension,
        height: limits.media.maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: limits.media.webpQuality })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new ActionFailure("invalidImage");
  } finally {
    await storage.remove(uploadId);
  }

  const key = assetKey();
  await storage.write(key, image.data, "image/webp");
  const row = {
    key,
    name: displayName(name),
    mimeType: "image/webp",
    width: image.info.width,
    height: image.info.height,
    sizeBytes: image.data.byteLength,
    uploadedById: actorId,
  };
  try {
    const id = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(mediaAssets).values(row).returning({ id: mediaAssets.id });
      if (!inserted) throw new Error("Media row was not inserted.");
      await writeAuditLog(tx, {
        actorId,
        action: "media.upload",
        entityType: "media_asset",
        entityId: inserted.id,
        changes: { name: row.name, width: row.width, height: row.height, size: row.sizeBytes },
      });
      return inserted.id;
    });
    return { id, name: row.name, src: mediaUrl(key), width: row.width, height: row.height };
  } catch (error) {
    // No row points at the stored image: do not leave it behind.
    await storage.remove(key);
    throw error;
  }
}

export async function renameMedia({ id, name }: MediaRename, actorId: string): Promise<null> {
  await db.transaction(async (tx) => {
    const [before] = await tx
      .select({ name: mediaAssets.name })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .for("update");
    if (!before) throw new ActionFailure("notFound");
    if (before.name === name) return;
    await tx.update(mediaAssets).set({ name, updatedAt: new Date() }).where(eq(mediaAssets.id, id));
    await writeAuditLog(tx, {
      actorId,
      action: "media.rename",
      entityType: "media_asset",
      entityId: id,
      changes: { name: { from: before.name, to: name } },
    });
  });
  return null;
}

/**
 * Deletes an image nobody uses (refused with `inUse` otherwise, so no page loses its picture).
 * The stored object is removed after the row; bundled placeholders have none.
 */
export async function deleteMedia(id: string, actorId: string): Promise<null> {
  const key = await db.transaction(async (tx) => {
    const [asset] = await tx
      .select({ key: mediaAssets.key, name: mediaAssets.name, uses: usageCount() })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .for("update");
    if (!asset) throw new ActionFailure("notFound");
    if (asset.uses > 0) throw new ActionFailure("inUse");
    await tx.delete(mediaAssets).where(eq(mediaAssets.id, id));
    await writeAuditLog(tx, {
      actorId,
      action: "media.delete",
      entityType: "media_asset",
      entityId: id,
      changes: { name: asset.name, key: asset.key },
    });
    return asset.key;
  });
  if (!isBundledKey(key)) {
    // The row is gone; a leftover object is harmless, so a storage hiccup does not fail the delete.
    await storage.remove(key).catch((error: unknown) => {
      console.error("[media] could not remove stored object", key, error);
    });
  }
  return null;
}
