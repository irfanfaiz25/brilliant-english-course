"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { limits } from "@/config/limits";

import { addLeadNoteAction } from "../admin-actions";
import { leadNoteSchema, type LeadNote, type LeadNoteInput } from "../schema";

/** A follow-up note added to the top of the lead's history. */
export function LeadNoteForm({ leadId }: { leadId: string }) {
  const t = useTranslations("AdminLeads.note");
  const errorText = useFormErrorText();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<LeadNoteInput, unknown, LeadNote>({
    resolver: zodResolver(leadNoteSchema),
    defaultValues: { id: leadId, body: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const result = await addLeadNoteAction(form.getValues());
      if (!result.ok) {
        const code = result.fieldErrors?.body;
        if (code) form.setError("body", { message: code });
        toast.error(errorText(result.error));
        return;
      }
      form.reset({ id: leadId, body: "" });
      toast.success(t("saved"));
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <Field label={t("label")} error={errorText(errors.body?.message)}>
        {(control) => (
          <Textarea
            {...control}
            {...form.register("body")}
            rows={3}
            maxLength={limits.leads.noteMax}
            placeholder={t("placeholder")}
          />
        )}
      </Field>
      <Button type="submit" variant="secondary" size="sm" loading={isPending} className="self-end">
        {t("submit")}
      </Button>
    </form>
  );
}
