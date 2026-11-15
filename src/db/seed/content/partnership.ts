import { placeholderImages } from "@/config/placeholder-images";
import {
  partnershipKitDefaults,
  partnershipTrainingDefaults,
} from "@/features/partners/page-defaults";
import type { PartnershipKit, PartnershipTraining } from "@/features/partners/page-schema";

/*
 * PLACEHOLDER photos for the Kemitraan page sections (ADR-041): the code defaults with sample
 * classroom photos on a few starter-kit items and the training gallery, until BEC uploads real ones.
 */

type MediaId = (src: string) => string;

/** Starter-kit item titles (Indonesian) → sample photo. */
const kitPhotos: Record<string, string> = {
  "Modul belajar level 1–5": placeholderImages.activityBook.src,
  Boardgames: placeholderImages.activityMarket.src,
  "Pelatihan tutor BEC": placeholderImages.activityStorytelling.src,
};

export function partnershipKitFixture(mediaId: MediaId): PartnershipKit {
  return {
    ...partnershipKitDefaults,
    items: partnershipKitDefaults.items.map((item) => {
      const src = kitPhotos[item.texts.id.title];
      return src ? { ...item, imageId: mediaId(src) } : item;
    }),
  };
}

export function partnershipTrainingFixture(mediaId: MediaId): PartnershipTraining {
  return {
    ...partnershipTrainingDefaults,
    photos: [
      {
        imageId: mediaId(placeholderImages.levelIntro.src),
        caption: { id: "Pelatihan tutor BEC", en: "BEC tutor training" },
      },
      {
        imageId: mediaId(placeholderImages.activityStorytelling.src),
        caption: { id: "Praktik mengajar bersama", en: "Teaching practice together" },
      },
      {
        imageId: mediaId(placeholderImages.activityBook.src),
        caption: { id: "Bedah buku BEC", en: "BEC book walkthrough" },
      },
    ],
  };
}
