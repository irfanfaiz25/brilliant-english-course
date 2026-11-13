import type { ReactNode } from "react";

import { PageTransition } from "@/components/motion/page-transition";

/** Templates remount on navigation, so the page transition's enter/exit run for every route. */
export default function LocaleTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
