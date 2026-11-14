"use server";

import { z } from "zod";

import { getCurrentUser } from "@/features/users/session";
import { canAccessAdmin } from "@/lib/permissions";

import { getRegionChildren } from "./queries";
import { regionCodeSchema, type Region } from "./schema";

const parentSchema = z.union([z.null(), regionCodeSchema]);

/**
 * Children of a region for the admin region picker (cached reference data). Staff only: the
 * public finder gets the same lists through its server-rendered filter.
 */
export async function loadRegionChildren(parentCode: unknown): Promise<Region[]> {
  const parsed = parentSchema.safeParse(parentCode);
  if (!parsed.success) return [];
  if (!canAccessAdmin(await getCurrentUser())) return [];
  return getRegionChildren(parsed.data);
}
