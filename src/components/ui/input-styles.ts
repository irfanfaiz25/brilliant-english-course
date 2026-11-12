/**
 * Shared look for text-entry controls (Input, Textarea, Select trigger, Combobox trigger),
 * so every field has the same height, border, focus halo and invalid state.
 */
export const fieldControlClass = [
  "w-full min-w-0 rounded-md border border-input bg-background px-4 text-body text-foreground",
  "transition-[border-color,box-shadow] duration-(--duration-fast) ease-out",
  "placeholder:text-neutral-400 hover:border-neutral-400",
  "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft focus-visible:outline-none",
  "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive-soft",
  "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:border-input",
].join(" ");
