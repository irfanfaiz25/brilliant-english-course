import { z } from "zod";

import { testimonialAudiences } from "@/config/enums";

export { testimonialAudiences };

/** A published testimonial, resolved to one locale. */
export const testimonialSchema = z.object({
  id: z.string().min(1),
  audience: z.enum(testimonialAudiences),
  quote: z.string().min(10),
  author: z.string().min(1),
  /** Context line, e.g. "Orang tua siswa Kindy · Kab. Bogor". */
  role: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

export type Testimonial = z.infer<typeof testimonialSchema>;
