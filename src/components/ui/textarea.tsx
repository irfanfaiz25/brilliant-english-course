import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { fieldControlClass } from "./input-styles";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldControlClass, "field-sizing-content min-h-28 py-3", className)}
      {...props}
    />
  );
}

export { Textarea };
