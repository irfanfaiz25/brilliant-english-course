"use client";

import { useEffect, useState } from "react";

import { limits } from "@/config/limits";

import type { RegionLevel, RegionSearchResult } from "../schema";

/** Wait after the last keystroke before searching. */
const SUGGEST_DEBOUNCE_MS = 250;

export type SuggestionState =
  | { status: "idle"; results: [] }
  | { status: "loading"; results: RegionSearchResult[] }
  | { status: "done"; results: RegionSearchResult[] }
  | { status: "error"; results: [] };

const idle: SuggestionState = { status: "idle", results: [] };

/**
 * Regions matching the typed text, from `/api/regions/search` (ADR-047). Waits for a pause in
 * typing and for `limits.regionSearch.minChars` characters, and cancels a search the next
 * keystroke makes stale. While a new search runs, the previous results stay visible.
 */
export function useRegionSuggestions(
  text: string,
  { levels, quota = false }: { levels: readonly RegionLevel[]; quota?: boolean },
): SuggestionState {
  const [state, setState] = useState<SuggestionState>(idle);
  const query = text.trim();
  const enabled = query.length >= limits.regionSearch.minChars;
  const levelsKey = levels.join(",");

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState((previous) => ({ status: "loading", results: previous.results }));
      try {
        const params = new URLSearchParams({ q: query, levels: levelsKey });
        if (quota) params.set("quota", "true");
        const response = await fetch(`/api/regions/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Region search failed: ${response.status}`);
        const body = (await response.json()) as { results: RegionSearchResult[] };
        setState({ status: "done", results: body.results });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setState({ status: "error", results: [] });
      }
    }, SUGGEST_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, query, levelsKey, quota]);

  return enabled ? state : idle;
}
