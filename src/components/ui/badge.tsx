import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Status and level badges (DESIGN.md § 4). Always carry text; color is never the only signal.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold whitespace-nowrap [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-primary-soft text-primary",
        partner: "bg-partner-soft text-level-secondary-strong",
        kindy: "bg-level-kindy-soft text-level-kindy-strong",
        intro: "bg-level-intro-soft text-level-intro-strong",
        secondary: "bg-level-secondary-soft text-level-secondary-strong",
        success: "bg-success-soft text-success-strong",
        warning: "bg-warning-soft text-warning-strong",
        destructive: "bg-destructive-soft text-destructive-strong",
        info: "bg-info-soft text-info-strong",
        outline: "border border-border bg-background text-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    /** Leading status dot in the badge's text color. */
    dot?: boolean;
  };

function Badge({
  className,
  variant,
  asChild = false,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants, type BadgeProps };
