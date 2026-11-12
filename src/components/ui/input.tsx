import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { fieldControlClass } from "./input-styles";

function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldControlClass, "h-12", className)}
      {...props}
    />
  );
}

export { Input };
