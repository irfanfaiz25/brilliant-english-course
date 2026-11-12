"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "./command";
import { fieldControlClass } from "./input-styles";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type ComboboxOption = { value: string; label: string };

type ComboboxProps = Omit<ComponentProps<"button">, "value" | "onChange"> & {
  options: readonly ComboboxOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
};

/**
 * Searchable single select for long lists (regions, units). Filtering is client-side over
 * `options`; server-side search is layered on top by the feature that uses it.
 */
function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  disabled,
  ...triggerProps
}: ComboboxProps) {
  const t = useTranslations("UI");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          data-placeholder={selected ? undefined : ""}
          className={cn(
            fieldControlClass,
            "flex h-12 items-center justify-between gap-2 text-left data-placeholder:text-neutral-400",
            className,
          )}
          {...triggerProps}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDownIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 overflow-hidden p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? t("search")} />
          <CommandList id={listId}>
            <CommandEmpty>{emptyText ?? t("noResults")}</CommandEmpty>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onValueChange(option.value === value ? null : option.value);
                  setOpen(false);
                }}
              >
                <span className="flex-1 truncate">{option.label}</span>
                <CheckIcon
                  aria-hidden
                  className={cn(
                    "size-4 text-primary",
                    option.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox, type ComboboxOption, type ComboboxProps };
