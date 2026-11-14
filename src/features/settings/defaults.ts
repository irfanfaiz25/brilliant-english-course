import { siteConfig } from "@/config/site";

import type { ContactSettings } from "./schema";

/**
 * Code default of the `contact` setting, used until an admin saves one (Phase 4a). PLACEHOLDER
 * values from `siteConfig`: replace with BEC's real details before launch.
 */
export const contactSettingsDefaults: ContactSettings = {
  ...siteConfig.contact,
  officeHours: [
    { days: [1, 2, 3, 4, 5], opens: "08:00", closes: "17:00" },
    { days: [6], opens: "08:00", closes: "12:00" },
  ],
  social: { ...siteConfig.social },
};
