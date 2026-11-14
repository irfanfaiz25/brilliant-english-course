import { firstParam, listHref, pageParam } from "@/components/admin/list-href";
import { adminRoutes } from "@/config/admin-routes";
import type { LeadFilter } from "@/features/partners/admin-queries";
import { leadStatuses, type LeadStatus } from "@/features/partners/schema";

type Params = Record<string, string | string[] | undefined>;

/** `?q=&status=&mine=1&page=` → a valid filter; anything unexpected falls back to the defaults. */
export function readLeadFilter(params: Params): LeadFilter {
  const status = firstParam(params.status);
  return {
    query: (firstParam(params.q) ?? "").slice(0, 80),
    status:
      status === "open" || leadStatuses.includes(status as LeadStatus)
        ? (status as LeadFilter["status"])
        : null,
    mine: firstParam(params.mine) === "1",
    page: pageParam(params.page),
  };
}

/** List (or export) URL for a filter; changing the filter goes back to page 1. */
export function leadListHref(filter: Partial<LeadFilter>, base: string = adminRoutes.leads) {
  return listHref(base, {
    q: filter.query,
    status: filter.status,
    mine: filter.mine,
    page: filter.page,
  });
}
