import { cn } from "@/lib/utils";

const tones = {
  primary: "bg-teal-300/40",
  partner: "bg-orange-300/35",
  highlight: "bg-sunny-300/45",
  inverse: "bg-teal-500/30",
} as const;

/**
 * Soft blurred color field for depth behind content (DESIGN.md § 1.1). Purely decorative:
 * position and size it with `className`; the parent needs `relative overflow-hidden`.
 */
export function DecorBlob({
  tone = "primary",
  className,
}: {
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -z-10 rounded-full blur-3xl",
        tones[tone],
        className,
      )}
    />
  );
}
