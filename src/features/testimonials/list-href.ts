import { listHref } from "@/components/admin/list-href";
import { adminRoutes } from "@/config/admin-routes";

import type { TestimonialAudience } from "./schema";

/** The admin list of one audience; parents, the default tab, keep the plain URL. */
export const testimonialListHref = (audience: TestimonialAudience) =>
  listHref(adminRoutes.testimonials, { audience: audience === "parent" ? null : audience });
