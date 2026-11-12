"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Label } from "./label";

/** Accessibility props a control receives from `Field`. Spread them onto the input. */
type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
};

type FieldProps = {
  label: ReactNode;
  /** Helper text shown under the control. */
  description?: ReactNode;
  /** Validation message; also marks the control invalid. */
  error?: ReactNode;
  required?: boolean;
  /** Visually marks the field as required (screen readers use `aria-required`). */
  requiredMark?: ReactNode;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Label + control + helper + error with ids wired automatically (DESIGN.md § 4 Form field).
 * Usage: `<Field label="Nama">{(control) => <Input {...control} />}</Field>`
 */
function Field({
  label,
  description,
  error,
  required = false,
  requiredMark = "*",
  className,
  children,
}: FieldProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      data-slot="field"
      data-invalid={error ? true : undefined}
      className={cn("flex flex-col gap-2", className)}
    >
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden className="text-destructive">
            {requiredMark}
          </span>
        )}
      </Label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}
      {description && (
        <p id={descriptionId} className="text-body-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-body-sm font-medium text-destructive-strong">
          {error}
        </p>
      )}
    </div>
  );
}

export { Field, type FieldControlProps, type FieldProps };
