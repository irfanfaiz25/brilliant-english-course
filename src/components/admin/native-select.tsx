import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { fieldControlClass } from "@/components/ui/input-styles";
import { cn } from "@/lib/utils";

/**
 * A native `<select>` with the shared field look. Native on purpose: the OS picker is the best
 * long-list chooser on phones, and keyboard and screen-reader support come for free.
 */
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          fieldControlClass,
          "h-12 cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
