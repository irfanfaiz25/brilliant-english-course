import { listHref } from "@/components/admin/list-href";
import { adminRoutes } from "@/config/admin-routes";

import type { FaqTopic } from "./schema";

/** The admin list of one topic; parents, the default tab, keep the plain URL. */
export const faqListHref = (topic: FaqTopic) =>
  listHref(adminRoutes.faq, { topic: topic === "parents" ? null : topic });
