import type { BadgeProps } from "@/components/ui/badge";

import type { LevelTheme } from "./schema";

/**
 * Visual identity per level theme (DESIGN.md § 2.1 level tokens, ADR-038). An admin picks one of
 * these for each level. Full class names so Tailwind sees them.
 */
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
  /** Swatch in the admin theme picker. */
  swatch: string;
};

export const levelTheme: Record<LevelTheme, LevelThemeEntry> = {
  sunny: {
    badge: "kindy",
    accent: "text-level-kindy-strong",
    soft: "bg-level-kindy-soft",
    ring: "target:ring-level-kindy",
    bar: "bg-level-kindy",
    chip: "hover:border-level-kindy hover:bg-level-kindy-soft",
    halo: "hover:ring-level-kindy-soft has-[a:focus-visible]:ring-level-kindy-soft",
    decor: "highlight",
    frame: "bg-sunny-200/80",
    swatch: "bg-level-kindy",
  },
  teal: {
    badge: "intro",
    accent: "text-level-intro-strong",
    soft: "bg-level-intro-soft",
    ring: "target:ring-level-intro",
    bar: "bg-level-intro",
    chip: "hover:border-level-intro hover:bg-level-intro-soft",
    halo: "hover:ring-level-intro-soft has-[a:focus-visible]:ring-level-intro-soft",
    decor: "primary",
    frame: "bg-teal-100",
    swatch: "bg-level-intro",
  },
  orange: {
    badge: "secondary",
    accent: "text-level-secondary-strong",
    soft: "bg-level-secondary-soft",
    ring: "target:ring-level-secondary",
    bar: "bg-level-secondary",
    chip: "hover:border-level-secondary hover:bg-level-secondary-soft",
    halo: "hover:ring-level-secondary-soft has-[a:focus-visible]:ring-level-secondary-soft",
    decor: "partner",
    frame: "bg-orange-100",
    swatch: "bg-level-secondary",
  },
  blue: {
    badge: "levelBlue",
    accent: "text-level-blue-strong",
    soft: "bg-level-blue-soft",
    ring: "target:ring-level-blue",
    bar: "bg-level-blue",
    chip: "hover:border-level-blue hover:bg-level-blue-soft",
    halo: "hover:ring-level-blue-soft has-[a:focus-visible]:ring-level-blue-soft",
    decor: "primary",
    frame: "bg-level-blue-soft",
    swatch: "bg-level-blue",
  },
  green: {
    badge: "levelGreen",
    accent: "text-level-green-strong",
    soft: "bg-level-green-soft",
    ring: "target:ring-level-green",
    bar: "bg-level-green",
    chip: "hover:border-level-green hover:bg-level-green-soft",
    halo: "hover:ring-level-green-soft has-[a:focus-visible]:ring-level-green-soft",
    decor: "primary",
    frame: "bg-level-green-soft",
    swatch: "bg-level-green",
  },
  berry: {
    badge: "levelBerry",
    accent: "text-level-berry-strong",
    soft: "bg-level-berry-soft",
    ring: "target:ring-level-berry",
    bar: "bg-level-berry",
    chip: "hover:border-level-berry hover:bg-level-berry-soft",
    halo: "hover:ring-level-berry-soft has-[a:focus-visible]:ring-level-berry-soft",
    decor: "partner",
    frame: "bg-level-berry-soft",
    swatch: "bg-level-berry",
  },
};
