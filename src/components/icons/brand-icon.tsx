import { siFacebook, siInstagram, siTiktok, siWhatsapp, siYoutube } from "simple-icons";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Official brand glyphs (simple-icons). They use `currentColor`, so color comes from tokens. */
const icons = {
  whatsapp: siWhatsapp,
  instagram: siInstagram,
  facebook: siFacebook,
  youtube: siYoutube,
  tiktok: siTiktok,
} as const;

export type BrandIconName = keyof typeof icons;

type BrandIconProps = Omit<ComponentProps<"svg">, "children"> & { name: BrandIconName };

export function BrandIcon({ name, className, ...props }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={cn("size-5 shrink-0", className)}
      {...props}
    >
      <path d={icons[name].path} />
    </svg>
  );
}
