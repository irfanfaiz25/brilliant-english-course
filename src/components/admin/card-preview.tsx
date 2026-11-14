"use client";

import { ChevronDownIcon, EyeIcon, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";

import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type CardPreviewProps = {
  /** Locale of the copy shown (follows the form's language tab). */
  locale: Locale;
  /** Where the card appears, e.g. "Beranda". */
  placement: string;
  /** The public card, or `null` while it cannot be drawn (no photo yet). */
  children: ReactNode | null;
  className?: string;
};

/**
 * Live preview of the public card an admin form edits (DESIGN.md § 6). It renders the site's own
 * card component, made inert so it cannot be clicked or focused. From `xl` it is a sticky side
 * column; below that a collapsible panel so the form stays short.
 */
export function CardPreview({ locale, placement, children, className }: CardPreviewProps) {
  const t = useTranslations("AdminForms.preview");
  const tLocales = useTranslations("AdminForms.locales");
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl surface-glass-panel p-4 sm:p-5 xl:sticky xl:top-24",
        className,
      )}
    >
      {/* Always open from `xl`: a plain heading there, a disclosure button below. */}
      <h2 className="hidden items-center gap-2 text-label text-foreground xl:flex">
        <EyeIcon aria-hidden className="size-4 text-primary" />
        {t("title")}
      </h2>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-md text-left text-label text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring xl:hidden"
      >
        <EyeIcon aria-hidden className="size-4 text-primary" />
        <span className="flex-1">{t("title")}</span>
        <ChevronDownIcon
          aria-hidden
          className={cn(
            "size-4 transition-transform duration-(--duration-fast)",
            open && "rotate-180",
          )}
        />
      </button>
      <div id={bodyId} className={cn("flex-col gap-3", open ? "flex" : "hidden", "xl:flex")}>
        <p className="text-caption text-muted-foreground">
          {t("note", { placement, locale: tLocales(locale) })}
        </p>
        {children ? (
          // `inert`: the preview is a picture of the card, not a working link.
          <div inert lang={locale} className="select-none">
            {children}
          </div>
        ) : (
          <p className="flex flex-col items-center gap-2 rounded-xl bg-muted px-4 py-10 text-center text-body-sm text-muted-foreground">
            <ImageIcon aria-hidden className="size-6" />
            {t("needsImage")}
          </p>
        )}
      </div>
    </section>
  );
}
