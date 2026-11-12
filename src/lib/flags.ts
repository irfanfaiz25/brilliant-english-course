import { env } from "@/lib/env";

/** Internal design preview: explicit flag wins, otherwise enabled outside production. */
export const isDesignPreviewEnabled = env.ENABLE_DESIGN_PREVIEW ?? env.NODE_ENV !== "production";
