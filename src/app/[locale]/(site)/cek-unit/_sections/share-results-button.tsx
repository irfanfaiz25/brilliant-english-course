"use client";

import { LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Copies the current results URL (the finder state lives in the URL, so it is shareable). */
export function ShareResultsButton({
  labels,
}: {
  labels: { share: string; copied: string; failed: string };
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(labels.copied);
    } catch {
      toast.error(labels.failed);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={copy}
      className="shrink-0 max-sm:size-10 max-sm:px-0"
    >
      <LinkIcon aria-hidden />
      <span className="max-sm:sr-only">{labels.share}</span>
    </Button>
  );
}
