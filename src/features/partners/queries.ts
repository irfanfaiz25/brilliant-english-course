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

/** An item's icon: the fixed one, and the uploaded image that replaces it when set. */
export type ItemIcon = { icon: PartnershipIcon; iconImage: ImageRef | null };

/** The Kemitraan page content resolved to one locale, photos and custom icons as image refs. */
export type PartnershipPage = {
  benefits: (Copy & ItemIcon & { featured: boolean })[];
  kit: {
    investment: number | null;
    items: (Copy & ItemIcon & { group: StarterKitGroup; image: ImageRef | null })[];
  };
  training: {
    /** The gallery, photos missing from the library left out. */
    photos: { image: ImageRef; caption: string }[];
    flow: Copy[];
    formats: (Copy & ItemIcon)[];
  };
  steps: (Copy & ItemIcon & { action: PartnerStepAction })[];
};

/**
 * The page content in `locale`. A photo or custom icon deleted from the library simply falls back
 * to the item's fixed icon.
 */
export async function getPartnershipPage(locale: Locale): Promise<PartnershipPage> {
  const { benefits, kit, training, steps } = await getPartnershipPageContent();
  const iconImageIds = [...benefits.items, ...kit.items, ...training.formats, ...steps.items].map(
    (item) => item.iconImageId,
  );
  const media = await getMediaRows(
    [
      ...training.photos.map((photo) => photo.imageId),
      ...kit.items.map((item) => item.imageId),
      ...iconImageIds,
    ].filter(Boolean),
  );
  const image = (id: string, alt: string) => {
    const row = id ? media[id] : undefined;
    return row ? toImageRef(row, alt) : null;
  };
  // Decorative like the fixed icons: the item's title already says what it is.
  const localize = <T extends { texts: Record<Locale, Copy>; iconImageId: string }>({
    texts,
    iconImageId,
    ...item
  }: T) => ({ ...item, ...texts[locale], iconImage: image(iconImageId, "") });

  return {
    benefits: benefits.items.map(localize),
    kit: {
      investment: kit.investment,
      items: kit.items.map(({ imageId, ...item }) => ({
        ...localize(item),
        image: image(imageId, item.texts[locale].title),
      })),
    },
    training: {
      // The caption is the alt text; the section adds a generic one when a caption is empty.
      photos: training.photos.flatMap(({ imageId, caption }) => {
        const ref = image(imageId, caption[locale]);
        return ref ? [{ image: ref, caption: caption[locale] }] : [];
      }),
      flow: training.flow.map(({ texts }) => texts[locale]),
      formats: training.formats.map(localize),
    },
    steps: steps.items.map(localize),
  };
}
