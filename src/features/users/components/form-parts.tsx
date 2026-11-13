"use client";

import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { limits } from "@/config/limits";
import { cn } from "@/lib/utils";

import type { AuthError } from "../schema";

/** Translates a validation or action code from `Auth.errors`, filling in the limits it mentions. */
export function useAuthErrorText() {
  const t = useTranslations("Auth.errors");
  return (code: string | undefined) => {
    if (!code) return undefined;
    if (!t.has(code as AuthError)) return t("unknown");
    return t(code as AuthError, { min: limits.auth.passwordMin });
  };
}

/**
 * Callback ref that focuses a confirmation when it replaces the form, so keyboard and
 * screen-reader users land on it instead of on the removed submit button.
 */
export function focusOnMount(node: HTMLElement | null) {
  node?.focus();
}

/** Form-level error under the fields, announced to screen readers. */
export function FormAlert({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="flex animate-rise-in items-start gap-2 rounded-xl bg-destructive-soft px-4 py-3 text-body-sm text-destructive-strong"
    >
      <AlertCircleIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

/** Password input with a show/hide toggle (keeps the field's a11y props from `Field`). */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const t = useTranslations("Auth");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
        spellCheck={false}
        autoCapitalize="none"
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {visible ? (
          <EyeOffIcon aria-hidden className="size-5" />
        ) : (
          <EyeIcon aria-hidden className="size-5" />
        )}
      </button>
    </div>
  );
}
