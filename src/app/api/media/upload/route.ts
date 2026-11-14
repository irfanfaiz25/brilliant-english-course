import { limits } from "@/config/limits";
import { env } from "@/lib/env";
import { storage } from "@/lib/storage";
import { verifyUploadToken } from "@/lib/storage/upload-token";

/**
 * Upload endpoint of the local storage driver: the stand-in for an R2 presigned URL, so the
 * browser uploads the same way (and reports the same progress) with or without R2. The signed
 * token from `startUploadAction` is the permission; it names the one key and content type.
 */
export async function PUT(request: Request) {
  if (storage.name !== "local") return new Response(null, { status: 404 });
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const grant = verifyUploadToken(token, env.BETTER_AUTH_SECRET);
  if (!grant) return new Response(null, { status: 403 });
  if (request.headers.get("content-type") !== grant.contentType) {
    return new Response(null, { status: 415 });
  }

  const max = limits.media.maxUploadBytes;
  if (Number(request.headers.get("content-length") ?? 0) > max) {
    return new Response(null, { status: 413 });
  }
  // Read with a cap: the declared length is not trusted.
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return new Response(null, { status: 413 });
    }
    chunks.push(value);
  }
  if (size === 0) return new Response(null, { status: 400 });

  await storage.write(grant.key, Buffer.concat(chunks), grant.contentType);
  return new Response(null, { status: 200 });
}
