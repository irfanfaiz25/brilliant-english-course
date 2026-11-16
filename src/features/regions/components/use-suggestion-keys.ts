"use client";

import { useState, type KeyboardEvent } from "react";

/**
 * Keyboard model of a suggestion combobox (WAI-ARIA combobox with listbox popup): arrows move
 * the active option, Enter picks it, Escape closes the list. Without an active option, Enter is
 * left to the input's form (the finder's free-text search).
 */
export function useSuggestionKeys<T>(
  items: readonly T[],
  { open, onPick, onClose }: { open: boolean; onPick: (item: T) => void; onClose: () => void },
) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const active = open ? Math.min(activeIndex, items.length - 1) : -1;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) {
      if (event.key === "Escape") onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      const item = items[active];
      if (item !== undefined) onPick(item);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return { activeIndex: active, setActiveIndex, onKeyDown };
}
