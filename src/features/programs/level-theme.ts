import type { BadgeProps } from "@/components/ui/badge";

import type { LevelSlug } from "./schema";

/** Visual identity per level (DESIGN.md § 2.1 level tokens). Full class names so Tailwind sees them. */
type LevelThemeEntry = {
  badge: NonNullable<BadgeProps["variant"]>;
  /** Text color for icons and accents on light surfaces. */
  accent: string;
  soft: string;
  /** Ring color when the card is the URL `:target`. */
  ring: string;
  /** Color bar under the card photo. */
  bar: string;
  /** Hover state for age chips that point at this level. */
  chip: string;
  /** Soft level-colored halo when the card is hovered or focused. */
  halo: string;
  /** `DecorBlob` / `Doodle` tone that matches the level color. */
  decor: "primary" | "partner" | "highlight";
  /** Tilted frame behind the level photo. */
  frame: string;
};

export const levelTheme: Record<LevelSlug, LevelThemeEntry> = {
  kindy: {
    badge: "kindy",
    accent: "text-level-kindy-strong",
    soft: "bg-level-kindy-soft",
    ring: "target:ring-level-kindy",
    bar: "bg-level-kindy",
    chip: "hover:border-level-kindy hover:bg-level-kindy-soft",
    halo: "hover:ring-level-kindy-soft has-[a:focus-visible]:ring-level-kindy-soft",
    decor: "highlight",
    frame: "bg-sunny-200/80",
  },
  intro: {
    badge: "intro",
    accent: "text-level-intro-strong",
    soft: "bg-level-intro-soft",
    ring: "target:ring-level-intro",
    bar: "bg-level-intro",
    chip: "hover:border-level-intro hover:bg-level-intro-soft",
    halo: "hover:ring-level-intro-soft has-[a:focus-visible]:ring-level-intro-soft",
    decor: "primary",
    frame: "bg-teal-100",
  },
  secondary: {
    badge: "secondary",
    accent: "text-level-secondary-strong",
    soft: "bg-level-secondary-soft",
    ring: "target:ring-level-secondary",
    bar: "bg-level-secondary",
    chip: "hover:border-level-secondary hover:bg-level-secondary-soft",
    halo: "hover:ring-level-secondary-soft has-[a:focus-visible]:ring-level-secondary-soft",
    decor: "partner",
    frame: "bg-orange-100",
  },
};
