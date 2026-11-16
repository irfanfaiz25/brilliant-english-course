"use client";

import { MapPinIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { fillTemplate } from "@/lib/template";
import { cn } from "@/lib/utils";

import type { RegionLevel, RegionSearchResult } from "../schema";

export type RegionSuggestionLabels = {
  /** Short level names ("Kab/Kota", "Kecamatan", "Desa"), shown when several levels mix. */
  levels: Record<RegionLevel, string>;
  quota?: { available: string; almostFull: string; full: string };
};

const quotaBadge = { available: "success", almostFull: "warning", full: "destructive" } as const;

/** Option id inside a list, for `aria-activedescendant`. */
export const suggestionId = (listId: string, index: number) => `${listId}-option-${index}`;

/**
 * Listbox of region search results (ADR-047): the name, its area on a second line (so the four
 * "Tanah Baru" villages are told apart), the level when levels mix, and the village quota when
 * known. Pure view: the combobox owns focus and keyboard (`RegionSearch`, the finder's search).
 */
export function RegionSuggestionList({
  id,
  results,
  activeIndex,
  showLevel,
  labels,
  onSelect,
  onHover,
  note,
  className,
}: {
  id: string;
  results: readonly RegionSearchResult[];
  activeIndex: number;
  showLevel: boolean;
  labels: RegionSuggestionLabels;
  onSelect: (result: RegionSearchResult) => void;
  onHover: (index: number) => void;
  /** Shown under the options, e.g. that hamlets are not in the data. */
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-h-80 flex-col overflow-hidden rounded-xl border border-border/70 bg-popover shadow-lg",
        className,
      )}
    >
      <ul
        id={id}
        role="listbox"
        className="flex min-h-0 flex-col overflow-y-auto overscroll-contain p-1"
      >
        {results.map((result, index) => (
          <li
            key={result.code}
            id={suggestionId(id, index)}
            role="option"
            aria-selected={index === activeIndex}
            // Keep focus in the input: select on pointer down, before the input blurs.
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(result);
            }}
            onMouseMove={() => onHover(index)}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left",
              index === activeIndex ? "bg-primary-soft" : "hover:bg-muted",
            )}
          >
            <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-label text-foreground">{result.name}</span>
                {showLevel && (
                  <span className="text-caption text-muted-foreground">
                    {labels.levels[result.level]}
                  </span>
                )}
              </span>
              {result.area && (
                <span className="line-clamp-2 text-caption text-muted-foreground">
                  {result.area}
                </span>
              )}
            </span>
            {result.quota && labels.quota && (
              <Badge variant={quotaBadge[result.quota.status]} className="shrink-0">
                {result.quota.status === "almostFull"
                  ? fillTemplate(labels.quota.almostFull, { remaining: result.quota.remaining })
                  : labels.quota[result.quota.status]}
              </Badge>
            )}
          </li>
        ))}
      </ul>
      {note && (
        <p className="border-t border-border/70 bg-muted/50 px-4 py-2.5 text-caption text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}
