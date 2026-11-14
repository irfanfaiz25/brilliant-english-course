"use client";

import { useRouter } from "next/navigation";

import { adminRoutes } from "@/config/admin-routes";
import { RegionPicker } from "@/features/regions/components/region-picker";
import type { RegionPickerLevel } from "@/features/regions/picker";

/**
 * Region picker of the quota page: choosing a village opens its quota (`?desa=`), so the result is
 * a shareable URL rendered on the server.
 */
export function VillageCheckPicker({
  regionLevels,
}: {
  regionLevels: readonly RegionPickerLevel[];
}) {
  const router = useRouter();
  return (
    <RegionPicker
      initialLevels={regionLevels}
      onChange={(villageCode) => {
        if (villageCode) {
          router.push(`${adminRoutes.quota}?desa=${encodeURIComponent(villageCode)}#cek-desa`, {
            scroll: false,
          });
        }
      }}
    />
  );
}
