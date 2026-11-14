"use client";

import { CheckIcon, CopyIcon, TriangleAlertIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminTimeZone } from "@/config/admin-routes";

import type { AccessLinkKind } from "../rules";

export type ShownAccessLink = { url: string; kind: AccessLinkKind; expiresAt: Date };

type AccessLinkDialogProps = {
  /** The link to show; `null` closes the dialog. */
  link: ShownAccessLink | null;
  /** Whose link it is, named in the title and text. */
  name: string;
  onClose: () => void;
};

/**
 * Shows a freshly created activation or reset link once, to be copied and sent by hand (there is
 * no email yet, Phase 6). The link is a credential: it is never stored readable, so closing this
 * dialog loses it. It only closes through its buttons, not a stray click outside.
 */
export function AccessLinkDialog({ link, name, onClose }: AccessLinkDialogProps) {
  const t = useTranslations("AdminUsers.linkDialog");
  const format = useFormatter();
  const inputId = useId();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const close = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={link !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent onInteractOutside={(event) => event.preventDefault()}>
        {link && (
          <>
            <DialogHeader>
              <DialogTitle>
                {link.kind === "activation"
                  ? t("titleActivation", { name })
                  : t("titleReset", { name })}
              </DialogTitle>
              <DialogDescription>
                {t("body", {
                  name,
                  date: format.dateTime(link.expiresAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: adminTimeZone,
                  }),
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor={inputId}>{t("label")}</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={inputId}
                  readOnly
                  value={link.url}
                  onFocus={(event) => event.currentTarget.select()}
                  className="font-mono text-body-sm"
                />
                <Button type="button" onClick={copy} className="shrink-0">
                  {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
                  {t("copy")}
                </Button>
              </div>
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-warning-soft px-4 py-3 text-body-sm text-warning-strong">
              <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t("warning")}
            </p>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={close}>
                {t("done")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
