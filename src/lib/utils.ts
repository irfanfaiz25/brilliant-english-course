import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's default theme. Register the custom tokens from
 * `globals.css` so `cn("text-h1", "text-primary")` keeps both classes instead of treating the
 * font-size token as a color and dropping it.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "jumbo",
            "display",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "body-lg",
            "body",
            "body-sm",
            "caption",
            "label",
            "button",
            "overline",
          ],
        },
      ],
      shadow: [
        {
          shadow: [
            "brand",
            "brand-pressed",
            "partner",
            "partner-pressed",
            "card",
            "glow-primary",
            "glow-partner",
            "soft-pop",
            "soft-pop-pressed",
            "inverse-pop",
            "inverse-pop-pressed",
            "sheet",
          ],
        },
      ],
    },
  },
});

/** Joins class names and resolves Tailwind conflicts (last one wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
