"use client";

import { ClipboardPenIcon, MapPinIcon, MapPinnedIcon } from "lucide-react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Button } from "@/components/ui/button";
import { isPartnerPath } from "@/config/navigation";
import { Link, usePathname } from "@/i18n/navigation";

type MobileActionBarProps = {
  labels: {
    region: string;
    findUnit: string;
    chatWhatsApp: string;
    checkQuota: string;
    applyPartner: string;
  };
  whatsappUrl: string;
};

/**
 * Thumb-reach actions on phones (DESIGN.md § 4). Parents get "find a unit + WhatsApp";
 * partnership pages get "check quota + apply". Hidden from `lg` up, where the header has them.
 */
export function MobileActionBar({ labels, whatsappUrl }: MobileActionBarProps) {
  const pathname = usePathname();
  const forPartners = isPartnerPath(pathname);

  return (
    <div
      role="region"
      aria-label={labels.region}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-(--z-sticky) animate-in rounded-2xl border border-border/60 surface-glass p-2 shadow-lg duration-(--duration-slow) fade-in-0 slide-in-from-bottom-4 lg:hidden"
    >
      <div className="grid grid-cols-2 gap-2">
        {forPartners ? (
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href={{ pathname: "/kemitraan", hash: "kuota" }}>
                <MapPinnedIcon aria-hidden />
                {labels.checkQuota}
              </Link>
            </Button>
            <Button asChild variant="partner" size="sm">
              <Link href={{ pathname: "/kemitraan", hash: "daftar" }}>
                <ClipboardPenIcon aria-hidden />
                {labels.applyPartner}
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild size="sm">
              <Link href="/cek-unit">
                <MapPinIcon aria-hidden />
                {labels.findUnit}
              </Link>
            </Button>
            <Button asChild variant="whatsapp" size="sm">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <BrandIcon name="whatsapp" className="size-4" />
                {labels.chatWhatsApp}
              </a>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
