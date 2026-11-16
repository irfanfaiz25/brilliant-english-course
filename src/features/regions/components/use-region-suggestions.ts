"use client";

import { useEffect, useState } from "react";

import { limits } from "@/config/limits";

import type { RegionLevel, RegionSearchResult } from "../schema";

/** Wait after the last keystroke before searching. */
const SUGGEST_DEBOUNCE_MS = 250;

export type SuggestionState = {
  status: "idle" | "loading" | "done" | "error";
  results: RegionSearchResult[];
  /** Several comma terms and none matched in full (a hamlet or RT, below the village data). */
  partial: boolean;
};

const idle: SuggestionState = { status: "idle", results: [], partial: false };

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
      setState((previous) => ({ ...previous, status: "loading" }));
      try {
        const params = new URLSearchParams({ q: query, levels: levelsKey });
        if (quota) params.set("quota", "true");
        const response = await fetch(`/api/regions/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Region search failed: ${response.status}`);
        const body = (await response.json()) as {
          results: RegionSearchResult[];
          partial: boolean;
        };
        setState({ status: "done", results: body.results, partial: body.partial });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setState({ status: "error", results: [], partial: false });
      }
    }, SUGGEST_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, query, levelsKey, quota]);

  return enabled ? state : idle;
}
