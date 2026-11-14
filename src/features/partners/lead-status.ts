import type { BadgeProps } from "@/components/ui/badge";

import type { LeadStatus } from "./schema";

/** Badge color per pipeline stage (always shown with the stage name). */
export const leadStatusBadge = {
  new: "info",
  contacted: "primary",
  qualified: "warning",
  onboarding: "partner",
  converted: "success",
  rejected: "destructive",
  lost: "neutral",
} as const satisfies Record<LeadStatus, NonNullable<BadgeProps["variant"]>>;
