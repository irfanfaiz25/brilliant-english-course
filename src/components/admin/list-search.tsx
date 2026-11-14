"use client";

import { LoaderCircleIcon, SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Pause after the last keystroke before the list updates. */
export const SEARCH_DEBOUNCE_MS = 300;

type ListSearchProps = {
  /** The list's path; the search keeps its other URL parameters and goes back to page 1. */
  action: string;
  /** The current search (from the URL). */
  defaultValue: string;
  label: string;
  placeholder: string;
  /** Other filters, sent along when the form is submitted without JavaScript. */
  hiddenParams?: Record<string, string>;
  maxLength?: number;
  className?: string;
};

/**
 * Search-as-you-type for admin lists: the URL (`?q=`) follows the input after a short pause, so
 * results, paging and the back button keep working like links. The navigation runs in a
 * transition, which keeps the current results on screen until the new ones arrive (no skeleton
 * flash) and the input keeps its focus and caret. Enter searches at once, Escape clears.
 * Without JavaScript it is a plain GET form.
 */
export function ListSearch({
  action,
  defaultValue,
  label,
  placeholder,
  hiddenParams = {},
  maxLength = 80,
  className,
}: ListSearchProps) {
  const t = useTranslations("AdminForms.search");
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [synced, setSynced] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The URL changed elsewhere (a chip that clears the search, back button): follow it.
  if (defaultValue !== synced) {
    setSynced(defaultValue);
    if (defaultValue.trim() !== value.trim()) setValue(defaultValue);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (next: string) => {
    clearTimeout(timer.current);
    const query = next.trim();
    // Read the live URL, not props: another filter may have changed since this render.
    const params = new URLSearchParams(window.location.search);
    if (query === (params.get("q") ?? "").trim()) return;
    if (query) params.set("q", query);
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${action}?${qs}` : action, { scroll: false }));
  };

  const onChange = (next: string) => {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(next), SEARCH_DEBOUNCE_MS);
  };

  return (
    <form
      role="search"
      action={action}
      method="get"
      className={cn("relative w-full", className)}
      onSubmit={(event) => {
        event.preventDefault();
        search(value);
      }}
    >
      {Object.entries(hiddenParams).map(([name, paramValue]) => (
        <input key={name} type="hidden" name={name} value={paramValue} />
      ))}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {isPending ? (
        <LoaderCircleIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 animate-spin text-primary"
        />
      ) : (
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
        />
      )}
      <Input
        id={id}
        type="search"
        name="q"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            setValue("");
            search("");
          }
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        aria-busy={isPending || undefined}
        // The browser's own clear button would bypass the debounce; ours replaces it.
        className="pr-11 pl-11 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            search("");
          }}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <XIcon aria-hidden className="size-4" />
          <span className="sr-only">{t("clear")}</span>
        </button>
      )}
    </form>
  );
}
