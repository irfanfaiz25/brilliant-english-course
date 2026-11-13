"use client";

import { ChevronDownIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * FAQ-style disclosure. Panels are force-mounted so answers stay in the HTML for crawlers
 * (FAQPage), and open/close animate smoothly in CSS.
 */
const Accordion = AccordionPrimitive.Root;

function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "rounded-lg border border-border bg-card transition-[border-color,box-shadow] duration-(--duration-base) data-[state=open]:border-primary/30 data-[state=open]:shadow-md",
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 rounded-lg px-5 py-4 text-left text-h5 text-foreground transition-colors duration-(--duration-fast) hover:text-primary sm:px-6",
          className,
        )}
        {...props}
      >
        {children}
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-[transform,background-color,color] duration-(--duration-base) ease-out group-data-[state=open]:rotate-180 group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
          <ChevronDownIcon aria-hidden className="size-4" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      forceMount
      className="text-body text-muted-foreground"
      {...props}
    >
      {/*
       * Radix zeroes transitions on the Content element while it measures, so the animation lives
       * on this wrapper. Height animates both ways with the grid-rows technique (no JS measuring);
       * `visibility` flips only after closing finishes, hiding closed answers from keyboard and AT.
       */}
      <div className="invisible grid grid-rows-[0fr] transition-[grid-template-rows,visibility] duration-(--duration-slow) ease-out in-data-[state=open]:visible in-data-[state=open]:grid-rows-[1fr]">
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "-translate-y-1 px-5 pb-5 opacity-0 transition-[opacity,translate] duration-(--duration-slow) ease-out in-data-[state=open]:translate-y-0 in-data-[state=open]:opacity-100 sm:px-6",
              className,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
