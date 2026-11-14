import { readFile } from "node:fs/promises";

import { immutableCache, isSafeKey, localPath, storage } from "@/lib/storage";

const contentTypes: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/**
 * Serves stored images of the local storage driver (development and CI). With R2 the bucket's
 * own domain serves them and this answers 404. Only processed images (`media/…`) are public;
 * raw uploads waiting to be processed (`tmp/…`) are not.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/media/files/[...key]">) {
  const { key: segments } = await ctx.params;
  const key = segments.join("/");
  const type = contentTypes[key.split(".").at(-1) ?? ""];
  if (storage.name !== "local" || !key.startsWith("media/") || !isSafeKey(key) || !type) {
    return new Response(null, { status: 404 });
  }
  const body = await readFile(localPath(key)).catch(() => null);
  if (!body) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(body), {
    headers: { "Content-Type": type, "Cache-Control": immutableCache },
  });
}
