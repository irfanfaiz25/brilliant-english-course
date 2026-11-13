import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-button whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-(--duration-fast) ease-out",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        partner:
          "bg-partner text-partner-foreground hover:bg-partner-hover active:bg-partner-active",
        whatsapp: "bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp-hover",
        secondary:
          "border border-primary/30 bg-background text-primary hover:border-primary hover:bg-primary-soft",
        ghost: "text-foreground hover:bg-muted",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        sm: "h-10 px-4 text-body-sm font-semibold [&_svg:not([class*='size-'])]:size-4",
        md: "h-12 px-6",
        lg: "h-14 px-8",
        icon: "size-12",
        "icon-sm": "size-10",
      },
      /** Playful "pressable" depth (DESIGN.md § 2.4). Max one per viewport. */
      pop: { true: "", false: "" },
    },
    compoundVariants: [
      {
        variant: "primary",
        pop: true,
        className: "shadow-brand active:translate-y-1 active:shadow-brand-pressed",
      },
      {
        variant: "partner",
        pop: true,
        className: "shadow-partner active:translate-y-1 active:shadow-partner-pressed",
      },
      {
        variant: "secondary",
        pop: true,
        className: "shadow-soft-pop active:translate-y-1 active:shadow-soft-pop-pressed",
      },
    ],
    defaultVariants: { variant: "primary", size: "md", pop: false },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a link) with button styles. */
    asChild?: boolean;
    /** Shows a spinner and blocks interaction; keeps the label for screen readers. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  pop,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, pop }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-disabled={asChild && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <Loader2Icon aria-hidden className="absolute animate-spin" />
          <span className="inline-flex items-center gap-2 opacity-0">{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants, type ButtonProps };
