import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva("flex flex-col gap-5 rounded-xl bg-card text-card-foreground", {
  variants: {
    variant: {
      elevated: "border border-border/60 shadow-card",
      outline: "border border-border",
      soft: "bg-surface",
      warm: "bg-surface-warm",
    },
    /** Lift on hover for cards that are a single link (use with a stretched link inside). */
    interactive: {
      true: "relative transition-[transform,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg has-[a:focus-visible]:-translate-y-1 has-[a:focus-visible]:shadow-lg",
      false: "",
    },
    padding: { none: "", md: "p-6", lg: "p-8" },
  },
  defaultVariants: { variant: "elevated", interactive: false, padding: "md" },
});

type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

function Card({ className, variant, interactive, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, interactive, padding }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-header" className={cn("flex flex-col gap-2", className)} {...props} />
  );
}

function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3 data-slot="card-title" className={cn("text-h4 text-foreground", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-body text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("flex flex-col gap-3", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-auto flex items-center gap-3", className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
