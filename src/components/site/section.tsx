import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const sectionVariants = cva("relative isolate overflow-hidden", {
  variants: {
    tone: {
      plain: "bg-background",
      soft: "bg-gradient-soft",
      warm: "bg-gradient-warm",
      surface: "bg-surface",
      inverse: "bg-gradient-teal-deep text-inverse-foreground",
    },
    spacing: {
      default: "py-16 md:py-24 lg:py-28",
      compact: "py-12 md:py-16",
      none: "",
    },
  },
  defaultVariants: { tone: "plain", spacing: "default" },
});

type SectionProps = ComponentProps<"section"> &
  VariantProps<typeof sectionVariants> & {
    /** Classes for the inner page-width container. */
    containerClassName?: string;
  };

/**
 * Page section with a themed background and the standard page container (DESIGN.md § 1.1).
 * Decorative children such as `DecorBlob` can be placed alongside the content.
 */
export function Section({
  tone,
  spacing,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(sectionVariants({ tone, spacing }), className)} {...props}>
      <div className={cn("mx-auto w-full max-w-page px-5 md:px-8", containerClassName)}>
        {children}
      </div>
    </section>
  );
}
