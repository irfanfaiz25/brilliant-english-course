"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { useUrlState } from "@/components/site/url-state-shell";
import { fieldControlClass } from "@/components/ui/input-styles";
import { cn } from "@/lib/utils";

/** Wait after the last keystroke before searching, so typing stays smooth. */
const SEARCH_DEBOUNCE_MS = 450;

type SearchBoxProps = {
  /** Localized finder URL; the form still works as a plain GET without JS. */
  action: string;
  defaultValue: string;
  /** Other current params to keep when the text changes (region, location). */
  keep: Record<string, string>;
  labels: { label: string; placeholder: string; submit: string; clear: string };
  idPrefix: string;
};

export function SearchBox({ action, defaultValue, keep, labels, idPrefix }: SearchBoxProps) {
  const { navigate, isPending } = useUrlState();
  const [value, setValue] = useState(defaultValue);
  const lastSubmitted = useRef(defaultValue);
  const inputId = `${idPrefix}-q`;

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
        autoComplete="off"
        enterKeyHint="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
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
    </form>
  );
}
