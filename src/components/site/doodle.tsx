import { cn } from "@/lib/utils";

const shapes = {
  ring: <circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" strokeWidth="5" />,
  squiggle: (
    <path
      d="M3 30c6-12 12-12 18 0s12 12 18 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
    />
  ),
  plus: (
    <path
      d="M24 8v32M8 24h32"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
    />
  ),
  dots: (
    <g fill="currentColor">
      {[8, 24, 40].flatMap((x) =>
        [8, 24, 40].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" />),
      )}
    </g>
  ),
  blob: <path d="M24 4c11 0 20 8 20 19s-8 21-20 21S4 36 4 24 13 4 24 4Z" fill="currentColor" />,
} as const;

const tones = {
  primary: "text-teal-300",
  partner: "text-orange-300",
  highlight: "text-sunny-400",
  soft: "text-teal-100",
} as const;

type DoodleProps = {
  shape: keyof typeof shapes;
  tone?: keyof typeof tones;
  /** Position, size and motion (`animate-float`, `parallax-soft`) classes. */
  className?: string;
};

/**
 * Small playful brand shapes scattered around sections for depth (DESIGN.md § 1.1).
 * Decorative only; the parent needs `relative` (and usually `overflow-hidden`).
 */
export function Doodle({ shape, tone = "primary", className }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none absolute -z-10 size-10", tones[tone], className)}
    >
      {shapes[shape]}
    </svg>
  );
}
