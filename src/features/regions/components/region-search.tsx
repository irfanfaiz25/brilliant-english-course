"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";

import { useUrlState } from "@/components/site/url-state-shell";
import { fieldControlClass } from "@/components/ui/input-styles";
import { limits } from "@/config/limits";
import { fillTemplate } from "@/lib/template";
import { cn } from "@/lib/utils";

import type { RegionLevel, RegionSearchResult } from "../schema";
import {
  RegionSuggestionList,
  suggestionId,
  type RegionSuggestionLabels,
} from "./region-suggestion-list";
import { useRegionSuggestions } from "./use-region-suggestions";
import { useSuggestionKeys } from "./use-suggestion-keys";

export type RegionSearchLabels = RegionSuggestionLabels & {
  label: string;
  placeholder: string;
  /** "Ketik minimal {min} huruf". */
  minChars: string;
  loading: string;
  /** "Tidak ada wilayah bernama “{query}” …". */
  empty: string;
  error: string;
  /** "{count} hasil", announced to screen readers. */
  results: string;
  clear: string;
  /** Shown when several comma terms matched only in part (hamlets are not in the data). */
  partial: string;
};

/**
 * Type a region's name, pick it from the suggestions (ADR-047). Picking sets `?wilayah=` like the
 * `RegionFilter` cascade it sits above, so both stay in step; must be inside a `UrlStateShell`.
 * Needs JS; the cascade below works without it.
 */
export function RegionSearch({
  levels,
  quota = false,
  keep = {},
  labels,
}: {
  levels: readonly RegionLevel[];
  /** Show each village's partnership quota in the results (Kemitraan). */
  quota?: boolean;
  /** Params to keep when the region changes. */
  keep?: Record<string, string>;
  labels: RegionSearchLabels;
}) {
  const { navigate } = useUrlState();
  const inputId = useId();
  const listId = `${inputId}-list`;
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useRegionSuggestions(text, { levels, quota });
  const results = suggestions.results;

  const pick = (result: RegionSearchResult) => {
    navigate({ ...keep, wilayah: result.code });
    setText("");
    setOpen(false);
  };
  const keys = useSuggestionKeys(results, { open, onPick: pick, onClose: () => setOpen(false) });

  const typed = text.trim();
  const tooShort = typed.length > 0 && typed.length < limits.regionSearch.minChars;
  const showList = open && results.length > 0;
  const status = tooShort
    ? fillTemplate(labels.minChars, { min: limits.regionSearch.minChars })
    : suggestions.status === "loading" && results.length === 0
      ? labels.loading
      : suggestions.status === "error"
        ? labels.error
        : suggestions.status === "done" && results.length === 0
          ? fillTemplate(labels.empty, { query: typed })
          : "";

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-label text-foreground">
        {labels.label}
      </label>
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id={inputId}
          type="search"
          role="combobox"
          autoComplete="off"
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            showList && keys.activeIndex >= 0 ? suggestionId(listId, keys.activeIndex) : undefined
          }
          placeholder={labels.placeholder}
          value={text}
          maxLength={limits.regionSearch.maxChars}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            keys.setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={keys.onKeyDown}
          className={cn(
            fieldControlClass,
            "h-12 pr-11 pl-11 [&::-webkit-search-cancel-button]:hidden",
          )}
        />
        {suggestions.status === "loading" ? (
          <Loader2Icon
            aria-hidden
            className="absolute top-1/2 right-3.5 size-5 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        ) : (
          text && (
            <button
              type="button"
              onClick={() => setText("")}
              aria-label={labels.clear}
              className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <XIcon aria-hidden className="size-4" />
            </button>
          )
        )}
      </div>
      {showList && (
        <RegionSuggestionList
          id={listId}
          results={results}
          activeIndex={keys.activeIndex}
          showLevel={levels.length > 1}
          labels={labels}
          onSelect={pick}
          onHover={keys.setActiveIndex}
          note={suggestions.partial ? labels.partial : undefined}
          className="absolute inset-x-0 top-full z-(--z-dropdown) mt-1"
        />
      )}
      <p aria-live="polite" className="min-h-0 text-caption text-muted-foreground empty:hidden">
        {open && status
          ? status
          : showList
            ? fillTemplate(labels.results, { count: results.length })
            : ""}
      </p>
    </div>
  );
}
