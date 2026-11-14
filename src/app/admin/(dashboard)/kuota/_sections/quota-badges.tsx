import { getTranslations } from "next-intl/server";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { adminLocale } from "@/config/admin-routes";
import type { QuotaStatus } from "@/features/quota/schema";

const quotaBadge = {
  available: "success",
  almostFull: "warning",
  full: "destructive",
} as const satisfies Record<QuotaStatus, NonNullable<BadgeProps["variant"]>>;

/** Quota status with its word, never color alone. */
export async function QuotaBadge({ status }: { status: QuotaStatus }) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminQuota.status" });
  return (
    <Badge variant={quotaBadge[status]} dot>
      {t(status)}
    </Badge>
  );
}
