import type { BadgeProps } from "@/components/ui/badge";
import type { AccountStatus, UserRole } from "@/features/users/schema";

type Variant = NonNullable<BadgeProps["variant"]>;

/** Role colors: the more access, the stronger the color. */
export const roleBadge = {
  super_admin: "primary",
  admin: "info",
  editor: "neutral",
  mitra: "partner",
} as const satisfies Record<UserRole, Variant>;

export const statusBadge = {
  active: "success",
  invited: "warning",
  disabled: "neutral",
} as const satisfies Record<AccountStatus, Variant>;
