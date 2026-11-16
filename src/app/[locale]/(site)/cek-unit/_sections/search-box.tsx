"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { useUrlState } from "@/components/site/url-state-shell";
import { fieldControlClass } from "@/components/ui/input-styles";
import {
  RegionSuggestionList,
  suggestionId,
  type RegionSuggestionLabels,
} from "@/features/regions/components/region-suggestion-list";
import { useRegionSuggestions } from "@/features/regions/components/use-region-suggestions";
import { useSuggestionKeys } from "@/features/regions/components/use-suggestion-keys";
import type { RegionSearchResult } from "@/features/regions/schema";
import { cn } from "@/lib/utils";

/** Wait after the last keystroke before searching, so typing stays smooth. */
const SEARCH_DEBOUNCE_MS = 450;
/** Areas a parent may look in: a city, a district or a village (ADR-047). */
const AREA_LEVELS = ["regency", "district", "village"] as const;

type SearchBoxProps = {
  /** Localized finder URL; the form still works as a plain GET without JS. */
  action: string;
  defaultValue: string;
  /** Other current params to keep when the text changes (region, location). */
  keep: Record<string, string>;
  labels: { label: string; placeholder: string; submit: string; clear: string; hint: string };
  idPrefix: string;
  /** Area suggestions while typing: picking one filters by that region instead of the text. */
  areas: {
    labels: RegionSuggestionLabels & { partial: string };
    keep: Record<string, string>;
  };
};

/**
 * The finder's search: free text over unit names and places (Enter or a pause in typing), plus
 * area suggestions (ADR-047) — a city, district or village picked from the list becomes the
 * region filter. Without JS it is a plain GET form.
 */
export function SearchBox({ action, defaultValue, keep, labels, idPrefix, areas }: SearchBoxProps) {
  const { navigate, isPending } = useUrlState();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const lastSubmitted = useRef(defaultValue);
  const inputId = `${idPrefix}-q`;
  const listId = `${idPrefix}-areas`;
  const hintId = `${idPrefix}-q-hint`;
  const suggestions = useRegionSuggestions(open ? value : "", { levels: AREA_LEVELS });

  const pickArea = (area: RegionSearchResult) => {
    lastSubmitted.current = "";
    setValue("");
    setOpen(false);
    navigate({ ...areas.keep, wilayah: area.code });
  };
  const keys = useSuggestionKeys(suggestions.results, {
    open,
    onPick: pickArea,
    onClose: () => setOpen(false),
  });
  const showList = open && suggestions.results.length > 0;

  const submit = (text: string) => {
    const query = text.trim();
    if (query === lastSubmitted.current) return;
    lastSubmitted.current = query;
    navigate(query ? { ...keep, q: query } : keep);
  };

  // Live search: submit once typing pauses.
  useEffect(() => {
    if (value.trim() === lastSubmitted.current) return;
    const timer = window.setTimeout(() => submit(value), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // `submit` only closes over stable values and refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(false);
    submit(value);
  };

  return (
    <form action={action} method="get" role="search" onSubmit={onSubmit} className="relative">
      {Object.entries(keep).map(([name, keptValue]) => (
        <input key={name} type="hidden" name={name} value={keptValue} />
      ))}
      <label htmlFor={inputId} className="sr-only">
        {labels.label}
      </label>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id={inputId}
        name="q"
        type="search"
        role="combobox"
        autoComplete="off"
        enterKeyHint="search"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-describedby={hintId}
        aria-activedescendant={
          showList && keys.activeIndex >= 0 ? suggestionId(listId, keys.activeIndex) : undefined
        }
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          keys.setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={keys.onKeyDown}
        placeholder={labels.placeholder}
        className={cn(
          fieldControlClass,
          "h-12 pr-24 pl-12 [&::-webkit-search-cancel-button]:hidden",
        )}
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {isPending && (
          <Loader2Icon aria-hidden className="size-4 animate-spin text-muted-foreground" />
        )}
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              submit("");
            }}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground"
          >
            <XIcon aria-hidden className="size-4" />
            <span className="sr-only">{labels.clear}</span>
          </button>
        )}
        <button type="submit" className="sr-only">
          {labels.submit}
        </button>
      </div>
      <p id={hintId} className="sr-only">
        {labels.hint}
      </p>
      {showList && (
        <RegionSuggestionList
          id={listId}
          results={suggestions.results}
          activeIndex={keys.activeIndex}
          showLevel
          labels={areas.labels}
          onSelect={pickArea}
          onHover={keys.setActiveIndex}
          note={suggestions.partial ? areas.labels.partial : undefined}
          className="absolute inset-x-0 top-full z-(--z-dropdown) mt-1"
        />
      )}
    </form>
  );
}
