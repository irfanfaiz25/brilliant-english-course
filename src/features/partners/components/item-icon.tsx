import Image from "next/image";

import { cn } from "@/lib/utils";

import type { ItemIcon as ItemIconValue } from "../queries";
import { PartnershipIcon } from "./partnership-icon";

/**
 * A Kemitraan item's icon (ADR-041): the uploaded custom icon when there is one, otherwise the
 * fixed Lucide icon. `className` sizes either, so a custom icon fits the same tile. Decorative:
 * the item's title says what it is.
 */
export function ItemIcon({ item, className }: { item: ItemIconValue; className?: string }) {
  if (item.iconImage) {
    return (
      <Image
        src={item.iconImage.src}
        alt=""
        width={item.iconImage.width}
        height={item.iconImage.height}
        sizes="4rem"
        className={cn("object-contain", className)}
      />
    );
  }
  return <PartnershipIcon name={item.icon} className={className} />;
}
