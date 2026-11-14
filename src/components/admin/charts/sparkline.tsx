import { useId } from "react";

import { monotonePath } from "@/lib/chart";

import type { ChartColor } from "./area-trend-chart";

const W = 200;
const H = 40;

/**
 * A tiny trend line for a stat card: decorative (the card states the number), so hidden from
 * assistive technology and without axes or hover. Same curve and wash as `AreaTrendChart`.
 */
export function Sparkline({
  values,
  color = "--color-chart-1",
}: {
  values: readonly number[];
  color?: ChartColor;
}) {
  const id = useId();
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  // Keep the line off the very edges so the 2px stroke is never clipped.
  const line = monotonePath(
    values.map((value, index) => [
      (index / (values.length - 1)) * W,
      H - 2 - (value / max) * (H - 4),
    ]),
  );
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-10 w-full overflow-visible"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={`var(${color})`} stopOpacity={0.25} />
          <stop offset="100%" stopColor={`var(${color})`} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={`var(${color})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
