import { siteConfig } from "@/config/site";

import type { ContactSettings } from "./schema";

/**
 * PLACEHOLDER contact settings until the settings module (Phase 4a): the code defaults from
 * `siteConfig` plus office hours. Replace with BEC's real details before launch.
 */
export const contactSettingsFixture: ContactSettings = {
  ...siteConfig.contact,
  officeHours: [
    { days: [1, 2, 3, 4, 5], opens: "08:00", closes: "17:00" },
    { days: [6], opens: "08:00", closes: "12:00" },
  ],
  social: { ...siteConfig.social },
};
