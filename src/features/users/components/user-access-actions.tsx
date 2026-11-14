"use client";

import { KeyRoundIcon, LinkIcon, PowerIcon, PowerOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { Button } from "@/components/ui/button";

import { createUserAccessLinkAction, setUserActiveAction } from "../admin-actions";
import type { AccountStatus } from "../schema";
import { AccessLinkDialog, type ShownAccessLink } from "./access-link-dialog";

type UserAccessActionsProps = {
  id: string;
  name: string;
  status: AccountStatus;
  hasPassword: boolean;
  /** A link of the account is still valid: a new one replaces it, so ask first. */
  hasPendingLink: boolean;
  /** One's own account cannot be switched off (ADR-035). */
  isSelf: boolean;
};

/**
 * Access controls of an account page: a new activation (no password yet) or reset link, shown
 * once in a dialog, and switching the account off or on. Switching off asks first and names the
 * account; the server re-checks every rule (own account, last super admin).
 */
export function UserAccessActions({
  id,
  name,
  status,
  hasPassword,
  hasPendingLink,
  isSelf,
}: UserAccessActionsProps) {
  const t = useTranslations("AdminUsers.access");
  const errorText = useFormErrorText();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"link" | "deactivate" | null>(null);
  const [link, setLink] = useState<ShownAccessLink | null>(null);

  const createLink = () =>
    startTransition(async () => {
      const result = await createUserAccessLinkAction({ id });
      setConfirm(null);
      if (!result.ok) {
        toast.error(errorText(result.error));
        return;
      }
      setLink(result.data);
    });

  const setActive = (isActive: boolean) =>
    startTransition(async () => {
      const result = await setUserActiveAction({ id, isActive });
      setConfirm(null);
      if (!result.ok) {
        toast.error(errorText(result.error));
        return;
      }
      toast.success(isActive ? t("activated") : t("deactivated"));
      router.refresh();
    });

  const disabled = status === "disabled";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {!disabled && (
        <Button
          type="button"
          variant="secondary"
          loading={isPending && confirm !== "deactivate"}
          onClick={() => (hasPendingLink ? setConfirm("link") : createLink())}
        >
          {hasPassword ? <KeyRoundIcon aria-hidden /> : <LinkIcon aria-hidden />}
          {hasPassword ? t("linkReset") : t("linkActivation")}
        </Button>
      )}
      {!isSelf &&
        (disabled ? (
          <Button type="button" loading={isPending} onClick={() => setActive(true)}>
            <PowerIcon aria-hidden />
            {t("activate")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive-strong hover:bg-destructive-soft hover:text-destructive-strong"
            onClick={() => setConfirm("deactivate")}
          >
            <PowerOffIcon aria-hidden />
            {t("deactivate")}
          </Button>
        ))}

      <ConfirmDialog
        open={confirm === "link"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t("linkConfirmTitle", { name })}
        description={t("linkConfirmBody")}
        confirmLabel={t("linkConfirm")}
        onConfirm={createLink}
        pending={isPending}
      />
      <ConfirmDialog
        open={confirm === "deactivate"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t("deactivateTitle", { name })}
        description={t("deactivateBody", { name })}
        confirmLabel={t("deactivateConfirm")}
        onConfirm={() => setActive(false)}
        destructive
        pending={isPending}
      />
      <AccessLinkDialog
        link={link}
        name={name}
        onClose={() => {
          setLink(null);
          router.refresh();
        }}
      />
    </div>
  );
}
