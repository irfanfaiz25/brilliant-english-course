import type messages from "../../messages/id.json";
import type { routing } from "./routing";

// Type-safe locales and message keys for next-intl. `id.json` is the reference dictionary.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
