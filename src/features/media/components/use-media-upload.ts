"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { limits } from "@/config/limits";
import type { UploadTarget } from "@/lib/storage";

import { finishUploadAction, startUploadAction } from "../actions";
import type { UploadedMedia } from "../admin-service";
import { uploadFileError, type UploadErrorCode } from "../schema";

export type UploadStatus = "queued" | "uploading" | "processing" | "done" | "error" | "cancelled";

export type UploadItem = {
  id: string;
  file: File;
  /** Object URL of the file, for the thumbnail while it uploads. */
  preview: string;
  status: UploadStatus;
  /** Bytes sent so far (real progress from the browser). */
  loaded: number;
  error?: UploadErrorCode;
  result?: UploadedMedia;
};

/** Files sent at the same time; the rest wait their turn. */
const CONCURRENCY = 2;

const errorCodes: readonly UploadErrorCode[] = [
  "fileType",
  "fileTooLarge",
  "fileEmpty",
  "uploadFailed",
  "uploadMissing",
  "invalidImage",
  "forbidden",
  "unknown",
];

/** An action's error (or the first field error) as an upload error code. */
function toUploadError(result: { error: string; fieldErrors?: Partial<Record<string, string>> }) {
  const code = Object.values(result.fieldErrors ?? {})[0] ?? result.error;
  return (errorCodes as readonly string[]).includes(code) ? (code as UploadErrorCode) : "unknown";
}

class UploadError extends Error {
  constructor(readonly code: UploadErrorCode) {
    super(code);
  }
}

/** PUTs the file to the upload URL, reporting bytes sent; rejects with `uploadFailed`. */
function putFile(
  target: UploadTarget,
  file: File,
  onProgress: (loaded: number) => void,
  register: (xhr: XMLHttpRequest) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    register(xhr);
    xhr.open("PUT", target.url);
    for (const [name, value] of Object.entries(target.headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => onProgress(event.loaded);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new UploadError(xhr.status === 413 ? "fileTooLarge" : "uploadFailed"));
    xhr.onerror = () => reject(new UploadError("uploadFailed"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    xhr.send(file);
  });
}

/**
 * Upload queue of the media library: each file is checked, sent straight to storage with real
 * progress (`startUploadAction` → PUT → `finishUploadAction`), then processed on the server.
 * Two files upload at a time; any file can be cancelled, a failed one retried. The queue lives in
 * a ref (so scheduling never races a render) and is mirrored into state for the UI.
 */
export function useMediaUpload({
  onUploaded,
}: {
  /** Called for every finished file, e.g. to refresh the library or pick it in a form. */
  onUploaded?: (media: UploadedMedia) => void;
} = {}) {
  const [items, setItems] = useState<readonly UploadItem[]>([]);
  const queue = useRef<UploadItem[]>([]);
  const requests = useRef(new Map<string, XMLHttpRequest>());
  const onUploadedRef = useRef(onUploaded);

  useEffect(() => {
    onUploadedRef.current = onUploaded;
  }, [onUploaded]);

  const commit = useCallback(() => setItems([...queue.current]), []);

  const patch = useCallback(
    (id: string, change: Partial<UploadItem>) => {
      queue.current = queue.current.map((item) => (item.id === id ? { ...item, ...change } : item));
      commit();
    },
    [commit],
  );

  const isActive = (item: UploadItem) =>
    item.status === "uploading" || item.status === "processing";
  const statusOf = (id: string) => queue.current.find((item) => item.id === id)?.status;

  // `run` and `pump` call each other: a finished file starts the next one.
  const pumpRef = useRef<() => void>(() => {});

  const run = useCallback(
    async (item: UploadItem) => {
      try {
        const started = await startUploadAction({
          name: item.file.name,
          type: item.file.type,
          size: item.file.size,
        });
        if (!started.ok) throw new UploadError(toUploadError(started));
        if (statusOf(item.id) !== "uploading") return; // cancelled meanwhile
        await putFile(
          started.data,
          item.file,
          (loaded) => patch(item.id, { loaded }),
          (xhr) => requests.current.set(item.id, xhr),
        );
        requests.current.delete(item.id);
        patch(item.id, { status: "processing", loaded: item.file.size });
        const finished = await finishUploadAction({
          uploadId: started.data.uploadId,
          name: item.file.name,
        });
        if (!finished.ok) throw new UploadError(toUploadError(finished));
        patch(item.id, { status: "done", result: finished.data });
        onUploadedRef.current?.(finished.data);
      } catch (error) {
        requests.current.delete(item.id);
        const cancelled =
          (error instanceof DOMException && error.name === "AbortError") ||
          statusOf(item.id) === "cancelled";
        if (!cancelled) {
          patch(item.id, {
            status: "error",
            error: error instanceof UploadError ? error.code : "unknown",
          });
        }
      } finally {
        pumpRef.current();
      }
    },
    [patch],
  );

  /** Starts queued files while fewer than CONCURRENCY are on their way. */
  const pump = useCallback(() => {
    const free = CONCURRENCY - queue.current.filter(isActive).length;
    // Oldest first: the queue lists the newest on top.
    const next = queue.current
      .filter((item) => item.status === "queued")
      .reverse()
      .slice(0, free);
    if (next.length === 0) return;
    const ids = new Set(next.map((item) => item.id));
    queue.current = queue.current.map((item) =>
      ids.has(item.id) ? { ...item, status: "uploading", loaded: 0 } : item,
    );
    commit();
    for (const item of next) void run({ ...item, status: "uploading" });
  }, [commit, run]);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  // Leaving the page stops what is still uploading and frees the thumbnails.
  useEffect(() => {
    const pending = requests.current;
    return () => {
      for (const xhr of pending.values()) xhr.abort();
      for (const item of queue.current) URL.revokeObjectURL(item.preview);
    };
  }, []);

  /** Queues files (at most `maxFilesPerBatch`); returns how many were left out. */
  const add = useCallback(
    (files: readonly File[]) => {
      const accepted = files.slice(0, limits.media.maxFilesPerBatch);
      const added = accepted.map((file): UploadItem => {
        const error = uploadFileError(file);
        return {
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          status: error ? "error" : "queued",
          loaded: 0,
          error: error ?? undefined,
        };
      });
      queue.current = [...added.reverse(), ...queue.current];
      commit();
      pump();
      return files.length - accepted.length;
    },
    [commit, pump],
  );

  const cancel = useCallback(
    (id: string) => {
      patch(id, { status: "cancelled", loaded: 0 });
      requests.current.get(id)?.abort();
      requests.current.delete(id);
      pump();
    },
    [patch, pump],
  );

  const retry = useCallback(
    (id: string) => {
      patch(id, { status: "queued", loaded: 0, error: undefined });
      pump();
    },
    [patch, pump],
  );

  const remove = useCallback(
    (id: string) => {
      const item = queue.current.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      queue.current = queue.current.filter((entry) => entry.id !== id);
      commit();
    },
    [commit],
  );

  /** Removes everything that is no longer waiting or on its way. */
  const clear = useCallback(() => {
    queue.current = queue.current.filter((item) => {
      const keep = item.status === "queued" || isActive(item);
      if (!keep) URL.revokeObjectURL(item.preview);
      return keep;
    });
    commit();
  }, [commit]);

  return { items, add, cancel, retry, remove, clear };
}
