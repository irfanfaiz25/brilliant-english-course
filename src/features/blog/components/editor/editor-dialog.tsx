"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type EditorDialogField = {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  multiline?: boolean;
  required?: boolean;
  type?: "text" | "url";
};

type EditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: readonly EditorDialogField[];
  submitLabel: string;
  cancelLabel: string;
  /** Returns an error per field name, or nothing to close the dialog. */
  onSubmit: (values: Record<string, string>) => Partial<Record<string, string>> | void;
  /** An extra action on the left of the footer (e.g. "remove link"). */
  extra?: { label: string; onClick: () => void };
  /** Where focus goes when the dialog closes (the editor, not the page body). */
  onClosed?: () => void;
};

/** Small form dialog of the editor toolbar (link, image address, video, HTML import). */
export function EditorDialog({ open, onOpenChange, onClosed, ...props }: EditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        onCloseAutoFocus={(event) => {
          if (!onClosed) return;
          event.preventDefault();
          onClosed();
        }}
      >
        {/* Mounted per opening: fields start from their default values every time. */}
        <DialogForm {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DialogForm({
  title,
  description,
  fields,
  submitLabel,
  cancelLabel,
  onSubmit,
  extra,
  onClose,
}: Omit<EditorDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const formId = useId();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ""])),
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Inside the post form: keep this submit from reaching it.
    event.stopPropagation();
    const result = onSubmit(values);
    if (result && Object.keys(result).length > 0) setErrors(result);
    else onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        {fields.map((field) => (
          <Field
            key={field.name}
            label={field.label}
            description={field.description}
            error={errors[field.name]}
            required={field.required}
          >
            {(control) =>
              field.multiline ? (
                <Textarea
                  {...control}
                  rows={10}
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className="font-mono text-body-sm"
                />
              ) : (
                <Input
                  {...control}
                  type={field.type ?? "text"}
                  value={values[field.name] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                />
              )
            }
          </Field>
        ))}
      </form>
      <DialogFooter className="sm:justify-between">
        {extra ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive-strong"
            onClick={() => {
              extra.onClick();
              onClose();
            }}
          >
            {extra.label}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button type="submit" form={formId}>
            {submitLabel}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
