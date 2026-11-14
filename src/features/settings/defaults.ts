import type { ContactSettings } from "./schema";

/**
 * Code default of the `contact` setting, used until an admin saves one in Pengaturan.
 * PLACEHOLDER values: replace them in admin with BEC's real details before launch.
 */
export const contactSettingsDefaults: ContactSettings = {
  whatsapp: "6281200000000",
  email: "halo@beccourses.com",
  address: "Kab. Bogor, Jawa Barat",
  officeHours: [
    { days: [1, 2, 3, 4, 5], opens: "08:00", closes: "17:00" },
    { days: [6], opens: "08:00", closes: "12:00" },
  ],
  social: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    youtube: "https://www.youtube.com/",
    tiktok: "https://www.tiktok.com/",
  },
};
