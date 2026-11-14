import type { ComponentProps } from "react";

type PublishedCheckboxProps = ComponentProps<"input"> & { label: string; hint: string };

/** "Show on the site" checkbox with its explanation, for content edit forms. */
export function PublishedCheckbox({ label, hint, ...input }: PublishedCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background/60 p-4">
      <input
        type="checkbox"
        {...input}
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
      />
      <span className="flex flex-col gap-1">
        <span className="text-body-sm font-semibold text-foreground">{label}</span>
        <span className="text-body-sm text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
