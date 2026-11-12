"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog as SheetPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { closeButtonClass, overlayBackdropClass } from "./overlay-styles";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

const sheetVariants = cva(
  "fixed z-(--z-overlay) flex flex-col gap-6 bg-background p-6 shadow-lg ease-out data-[state=closed]:animate-out data-[state=closed]:duration-(--duration-base) data-[state=open]:animate-in data-[state=open]:duration-(--duration-slow)",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-[min(88vw,24rem)] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        left: "inset-y-0 left-0 h-full w-[min(88vw,24rem)] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        bottom:
          "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
      },
    },
    defaultVariants: { side: "right" },
  },
);

function SheetContent({
  className,
  children,
  side,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & VariantProps<typeof sheetVariants>) {
  const t = useTranslations("UI");

  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className={overlayBackdropClass} />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {side === "bottom" && (
          <span
            aria-hidden
            className="mx-auto -mt-2 h-1.5 w-12 shrink-0 rounded-full bg-neutral-300"
          />
        )}
        {children}
        <SheetPrimitive.Close className={closeButtonClass}>
          <XIcon aria-hidden />
          <span className="sr-only">{t("close")}</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 pr-12", className)} {...props} />;
}

function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-3", className)} {...props} />;
}

function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("text-h4 text-foreground", className)} {...props} />;
}

function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn("text-body text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
