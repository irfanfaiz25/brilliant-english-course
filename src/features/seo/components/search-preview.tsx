import { GlobeIcon } from "lucide-react";

type SearchPreviewProps = {
  label: string;
  title: string;
  url: string;
  description: string;
};

/**
 * Approximate search-result snippet so admins see how a title and description read. Long text
 * is clamped like search engines do; it is a guide, not an exact rendering.
 */
export function SearchPreview({ label, title, url, description }: SearchPreviewProps) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-caption font-semibold text-muted-foreground">{label}</figcaption>
      <div className="flex flex-col gap-1 rounded-xl border border-border/70 bg-background p-4">
        <span className="flex items-center gap-2 text-caption text-muted-foreground">
          <GlobeIcon aria-hidden className="size-4 shrink-0" />
          <span className="truncate">{url}</span>
        </span>
        <span className="line-clamp-1 text-body font-semibold text-info-strong">{title}</span>
        <span className="line-clamp-2 text-body-sm text-muted-foreground">{description}</span>
      </div>
    </figure>
  );
}
