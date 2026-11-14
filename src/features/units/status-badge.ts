import type { BadgeProps } from "@/components/ui/badge";

import type { UnitStatus } from "./schema";

/** Badge color per unit status in admin lists (always shown with the status word). */
export const unitStatusBadge = {
  onboarding: "info",
  active: "success",
  inactive: "neutral",
} as const satisfies Record<UnitStatus, NonNullable<BadgeProps["variant"]>>;
