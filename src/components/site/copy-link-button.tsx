"use client";

import { LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Copies the current page URL (finder results, a blog post…) with a toast as feedback.
 * `compact` hides the label on phones, leaving an icon button.
 */
export function CopyLinkButton({
  labels,
  variant = "ghost",
  compact = true,
  className,
}: {
  labels: { share: string; copied: string; failed: string };
  variant?: "ghost" | "secondary";
  compact?: boolean;
  className?: string;
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
      variant={variant}
      size="sm"
      onClick={copy}
      className={cn("shrink-0", compact && "max-sm:size-10 max-sm:px-0", className)}
    >
      <LinkIcon aria-hidden />
      <span className={cn(compact && "max-sm:sr-only")}>{labels.share}</span>
    </Button>
  );
}
