"use server";

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { limits } from "@/config/limits";
import { siteConfig } from "@/config/site";
import { getVillageQuota } from "@/features/quota/queries";
import { getRegionPath } from "@/features/regions/queries";
import { routing } from "@/i18n/routing";
import type { ActionResult } from "@/lib/action-result";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import { partnerApplicationSchema, type PartnerApplicationError } from "./schema";
import { createLeadReference, createPartnerLead } from "./service";

type SubmittedApplication = { reference: string; whatsappUrl: string; village: string };

const rateLimiter = createRateLimiter({
  limit: limits.partnerApplication.rateLimit,
  windowMs: limits.partnerApplication.rateWindowMs,
});

/**
 * Public "Daftar Mitra" submission (ADR-007): validate → honeypot → rate limit → quota check →
 * store the lead → hand back a reference and a pre-filled WhatsApp link. Public, so there is no
 * role check; the audit log and notifications are added with the leads table (Phases 3, 6).
 */
export async function submitPartnerApplication(
  locale: string,
  input: unknown,
  /** Honeypot field value; real visitors never see or fill it. */
  trap: string,
): Promise<ActionResult<SubmittedApplication, PartnerApplicationError>> {
  if (!hasLocale(routing.locales, locale)) return { ok: false, error: "invalid" };

  const parsed = partnerApplicationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
    );
    const error = fieldErrors.villageCode ? "villageRequired" : "invalid";
    return { ok: false, error, fieldErrors };
  }
  const application = parsed.data;

  const [path, tWhatsApp] = await Promise.all([
    getRegionPath(application.villageCode),
    getTranslations({ locale, namespace: "WhatsApp" }),
  ]);
  const village = path.at(-1)?.name;
  if (!village) return { ok: false, error: "villageRequired" };
  const whatsappFor = (reference: string) =>
    buildWhatsAppUrl(
      siteConfig.contact.whatsapp,
      tWhatsApp("partnerApplication", { name: application.fullName, village, reference }),
    );

  // A bot filled the hidden field: answer like a success so it learns nothing, store nothing.
  if (trap) {
    const reference = createLeadReference();
    return { ok: true, data: { reference, whatsappUrl: whatsappFor(reference), village } };
  }

  if (!rateLimiter.hit(clientIp(await headers()))) return { ok: false, error: "rateLimited" };

  const quota = await getVillageQuota(application.villageCode);
  if (quota.status === "full") return { ok: false, error: "quotaFull" };

  try {
    const { reference } = await createPartnerLead(application);
    return { ok: true, data: { reference, whatsappUrl: whatsappFor(reference), village } };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
