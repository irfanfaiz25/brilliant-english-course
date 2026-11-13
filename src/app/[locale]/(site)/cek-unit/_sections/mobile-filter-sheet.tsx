"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { RegionFilter } from "./region-filter";

type MobileFilterSheetProps = Omit<ComponentProps<typeof RegionFilter>, "onChange" | "idPrefix"> & {
  activeCount: number;
  labels: ComponentProps<typeof RegionFilter>["labels"] & {
    open: string;
    activeCount: string;
    description: string;
    showResults: string;
  };
};

/**
 * Phones: the region cascade lives in a bottom sheet so results stay the first thing on screen.
 * The trigger shows how many region levels are active.
 */
export function MobileFilterSheet({ activeCount, labels, ...filterProps }: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="w-full justify-between">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontalIcon aria-hidden />
            {labels.open}
          </span>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-caption font-semibold text-primary-foreground">
              {labels.activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="gap-5 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{labels.open}</SheetTitle>
          <SheetDescription>{labels.description}</SheetDescription>
        </SheetHeader>
        <RegionFilter {...filterProps} labels={labels} idPrefix="mobile" />
        <SheetFooter>
          <Button onClick={() => setOpen(false)}>{labels.showResults}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
