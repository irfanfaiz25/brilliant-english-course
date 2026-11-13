"use client";

import { ChevronRightIcon, MapPinIcon, MenuIcon } from "lucide-react";
import { useState } from "react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavItem } from "@/config/navigation";
import { Link } from "@/i18n/navigation";

import { LocaleSwitcher } from "./locale-switcher";
import { NavLink } from "./nav-link";

type MobileMenuProps = {
  items: readonly { href: NavItem["href"]; label: string }[];
  labels: {
    open: string;
    title: string;
    description: string;
    findUnit: string;
    joinPartner: string;
    chatWhatsApp: string;
  };
  whatsappUrl: string;
};

/**
 * Mobile navigation in a right-hand sheet. Labels come from the server as props, so no message
 * namespace is shipped to the browser for it. Navigating closes the sheet.
 */
export function MobileMenu({ items, labels, whatsappUrl }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={labels.open}>
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-8 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{labels.title}</SheetTitle>
          <SheetDescription>{labels.description}</SheetDescription>
        </SheetHeader>

        <nav aria-label={labels.title}>
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} variant="menu" onClick={close}>
                  {item.label}
                  <ChevronRightIcon aria-hidden className="size-5 text-muted-foreground" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <Button asChild>
            <Link href="/cek-unit" onClick={close}>
              <MapPinIcon aria-hidden />
              {labels.findUnit}
            </Link>
          </Button>
          <Button asChild variant="partner">
            <Link href="/kemitraan" onClick={close}>
              {labels.joinPartner}
            </Link>
          </Button>
          <Button asChild variant="whatsapp">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <BrandIcon name="whatsapp" />
              {labels.chatWhatsApp}
            </a>
          </Button>
          <LocaleSwitcher className="self-center pt-2" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
