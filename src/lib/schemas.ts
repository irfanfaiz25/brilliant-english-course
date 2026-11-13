import { z } from "zod";

/** Image reference shared by content types (local path now, R2 URL from Phase 4e). */
export const imageSchema = z.object({
  src: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string(),
});

export type ImageRef = z.infer<typeof imageSchema>;
