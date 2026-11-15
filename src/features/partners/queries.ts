import "server-only";

import { inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { toImageRef, type MediaRow } from "@/features/media/service";
import { readSetting } from "@/features/settings/queries";
import type { Locale } from "@/i18n/routing";
import type { ImageRef } from "@/lib/schemas";

import {
  partnershipBenefitsDefaults,
  partnershipKitDefaults,
  partnershipStepsDefaults,
  partnershipTrainingDefaults,
} from "./page-defaults";
import {
  partnershipBenefitsSchema,
  partnershipKitSchema,
  partnershipStepsSchema,
  partnershipTrainingSchema,
  type PartnershipIcon,
  type PartnershipPageContent,
  type PartnerStepAction,
  type StarterKitGroup,
} from "./page-schema";

/** Every editable section of the Kemitraan page: the saved settings or the code defaults. */
export async function getPartnershipPageContent(): Promise<PartnershipPageContent> {
  const [benefits, kit, training, steps] = await Promise.all([
    readSetting("partnershipBenefits", partnershipBenefitsSchema, partnershipBenefitsDefaults),
    readSetting("partnership", partnershipKitSchema, partnershipKitDefaults),
    readSetting("partnershipTraining", partnershipTrainingSchema, partnershipTrainingDefaults),
    readSetting("partnershipSteps", partnershipStepsSchema, partnershipStepsDefaults),
  ]);
  return { benefits, kit, training, steps };
}

/** Library rows of the given ids (photos picked for the page), cached with the settings. */
async function getMediaRows(ids: readonly string[]): Promise<Record<string, MediaRow>> {
  "use cache";
  cacheTag(cacheTags.settings);
  cacheLife("hours");
  if (ids.length === 0) return {};
  const rows = await db
    .select({
      id: mediaAssets.id,
      key: mediaAssets.key,
      width: mediaAssets.width,
      height: mediaAssets.height,
    })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, [...ids]));
  return Object.fromEntries(rows.map(({ id, ...row }) => [id, row]));
}

type Copy = { title: string; text: string };

/** The Kemitraan page content resolved to one locale, photos as image refs. */
export type PartnershipPage = {
  benefits: (Copy & { icon: PartnershipIcon; featured: boolean })[];
  kit: {
    investment: number | null;
    items: (Copy & { group: StarterKitGroup; icon: PartnershipIcon; image: ImageRef | null })[];
  };
  training: {
    image: ImageRef | null;
    flow: Copy[];
    formats: (Copy & { icon: PartnershipIcon })[];
  };
  steps: (Copy & { icon: PartnershipIcon; action: PartnerStepAction })[];
};

/** The page content in `locale`. A photo deleted from the library simply falls back to the icon. */
export async function getPartnershipPage(locale: Locale): Promise<PartnershipPage> {
  const { benefits, kit, training, steps } = await getPartnershipPageContent();
  const media = await getMediaRows(
    [training.imageId, ...kit.items.map((item) => item.imageId)].filter(Boolean),
  );
  const image = (id: string, alt: string) => {
    const row = id ? media[id] : undefined;
    return row ? toImageRef(row, alt) : null;
  };

  return {
    benefits: benefits.items.map(({ texts, ...item }) => ({ ...item, ...texts[locale] })),
    kit: {
      investment: kit.investment,
      items: kit.items.map(({ texts, imageId, ...item }) => ({
        ...item,
        ...texts[locale],
        image: image(imageId, texts[locale].title),
      })),
    },
    training: {
      // Alt text comes from the page copy where the photo is shown.
      image: image(training.imageId, ""),
      flow: training.flow.map(({ texts }) => texts[locale]),
      formats: training.formats.map(({ texts, ...item }) => ({ ...item, ...texts[locale] })),
    },
    steps: steps.items.map(({ texts, ...item }) => ({ ...item, ...texts[locale] })),
  };
}
