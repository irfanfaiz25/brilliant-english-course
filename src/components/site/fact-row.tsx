import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const tones = {
  light: {
    icon: "bg-primary-soft text-primary",
    label: "text-muted-foreground",
    value: "text-foreground",
  },
  inverse: {
    icon: "bg-white/10 text-sunny-300",
    label: "text-inverse-muted",
    value: "text-inverse-foreground",
  },
} as const;

type FactRowProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  /** `inverse` on dark brand surfaces. */
  tone?: keyof typeof tones;
};

/**
 * One icon + label + value row inside a `<dl>`. The wrapper `div` holds only `dt` and `dd` (the
 * icon sits inside `dt`), so the description list stays valid for assistive technology.
 */
export function FactRow({ icon, label, children, tone = "light" }: FactRowProps) {
  const styles = tones[tone];

  return (
    <div className="relative flex min-h-11 flex-col gap-1 pl-15">
      <dt className={cn("text-caption uppercase", styles.label)}>
        <span
          aria-hidden
          className={cn(
            "absolute top-0 left-0 inline-flex size-11 items-center justify-center rounded-xl [&_svg]:size-5",
            styles.icon,
          )}
        >
          {icon}
        </span>
        {label}
      </dt>
      <dd className={cn("min-w-0 text-body", styles.value)}>{children}</dd>
    </div>
  );
}
