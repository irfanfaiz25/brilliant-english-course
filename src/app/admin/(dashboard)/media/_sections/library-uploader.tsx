"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { MediaUploader } from "@/features/media/components/media-uploader";

/** The library's uploader: every finished file refreshes the grid below. */
export function LibraryUploader() {
  const router = useRouter();
  const onUploaded = useCallback(() => router.refresh(), [router]);
  return <MediaUploader onUploaded={onUploaded} linkToDetail />;
}
