"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";

import { monotonePath, niceScale } from "@/lib/chart";
import { cn } from "@/lib/utils";

/** CSS variables of the chart series colors, in their fixed order (globals.css, ADR-037). */
export const chartColors = ["--color-chart-1", "--color-chart-2"] as const;
export type ChartColor = (typeof chartColors)[number];

export type TrendSeries = {
  key: string;
  label: string;
  color: ChartColor;
  values: readonly number[];
};

export type TrendPoint = {
  /** Short axis label ("10 Nov"). */
  short: string;
  /** Full label for the tooltip and table ("Minggu 10–16 Nov 2026"). */
  full: string;
};

type AreaTrendChartProps = {
  series: readonly TrendSeries[];
  points: readonly TrendPoint[];
  labels: {
    /** Names the plot for screen readers and keyboard users. */
    plot: string;
    period: string;
    showTable: string;
    empty: string;
  };
};

// Drawing space of the SVG; it stretches to the box (`preserveAspectRatio="none"`) while strokes
// keep 2px through `vector-effect`.
const W = 1000;
const H = 300;

/** Index of every `step`-th label, always including the last one. */
const labelIndexes = (count: number, step: number) =>
  new Set(
    Array.from({ length: count }, (_, index) => index).filter(
      (index) => index % step === 0 || index === count - 1,
    ),
  );

/**
 * Smooth area chart of up to two series over time (Ringkasan, ADR-037). Hand-built SVG: thin 2px
 * lines over a light gradient wash, a crosshair that snaps to the nearest period and one tooltip
 * listing every series (also on keyboard focus, arrows move it), and the numbers as a table.
 */
export function AreaTrendChart({ series, points, labels }: AreaTrendChartProps) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const count = points.length;
  const highest = Math.max(0, ...series.flatMap((item) => item.values));
  const scale = niceScale(highest);
  const x = (index: number) => (count <= 1 ? W / 2 : (index / (count - 1)) * W);
  const y = (value: number) => H - (value / scale.max) * H;
  const percentX = (index: number) => (x(index) / W) * 100;
  const percentY = (value: number) => (y(value) / H) * 100;
  const wide = labelIndexes(count, Math.ceil(count / 8));
  const narrow = labelIndexes(count, Math.ceil(count / 4));

  const indexAt = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = active ?? count - 1;
    const next =
      event.key === "ArrowLeft"
        ? current - 1
        : event.key === "ArrowRight"
          ? current + 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? count - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(Math.min(count - 1, Math.max(0, next)));
  };

  const point = active === null ? null : points[active];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {/* Y axis: round numbers, text tokens only. */}
        <div
          aria-hidden
          className="relative h-56 w-7 shrink-0 text-right text-caption text-muted-foreground tabular-nums sm:h-64"
        >
          {scale.ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${percentY(tick)}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="relative h-56 sm:h-64">
            <svg
              aria-hidden
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
            >
              <defs>
                {series.map((item) => (
                  <linearGradient
                    key={item.key}
                    id={`${id}-${item.key}`}
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={`var(${item.color})`} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={`var(${item.color})`} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              {scale.ticks.map((tick) => (
                <line
                  key={tick}
                  x1={0}
                  x2={W}
                  y1={y(tick)}
                  y2={y(tick)}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-border"
                  strokeWidth={1}
                />
              ))}
              {series.map((item) => {
                const line = monotonePath(item.values.map((value, index) => [x(index), y(value)]));
                return (
                  <g key={item.key}>
                    <path
                      d={`${line} L${W},${H} L0,${H} Z`}
                      fill={`url(#${id}-${item.key})`}
                      stroke="none"
                    />
                    <path
                      d={line}
                      fill="none"
                      stroke={`var(${item.color})`}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
            </svg>

            {highest === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-body-sm text-muted-foreground">
                {labels.empty}
              </p>
            )}

            {/* Crosshair and markers, in HTML so the dots stay round on a stretched SVG. */}
            {active !== null && (
              <>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-px bg-foreground/20"
                  style={{ left: `${percentX(active)}%` }}
                />
                {series.map((item) => (
                  <span
                    key={item.key}
                    aria-hidden
                    className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
                    style={{
                      left: `${percentX(active)}%`,
                      top: `${percentY(item.values[active] ?? 0)}%`,
                      backgroundColor: `var(${item.color})`,
                    }}
                  />
                ))}
              </>
            )}

            {/* The whole plot is the hit area: the pointer only has to be near a period. */}
            <div
              role="group"
              tabIndex={0}
              aria-label={labels.plot}
              aria-describedby={`${id}-tooltip`}
              onPointerMove={(event) => setActive(indexAt(event))}
              onPointerDown={(event) => setActive(indexAt(event))}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive((current) => current ?? count - 1)}
              onBlur={() => setActive(null)}
              onKeyDown={onKeyDown}
              className="absolute inset-0 cursor-crosshair touch-pan-y rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            />

            <div
              id={`${id}-tooltip`}
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-none absolute top-2 z-10 min-w-40 rounded-xl border border-border/70 bg-card px-3 py-2 shadow-md transition-opacity duration-(--duration-fast)",
                point ? "opacity-100" : "sr-only opacity-0",
              )}
              style={
                active === null
                  ? undefined
                  : active > count / 2
                    ? { right: `${100 - percentX(active) + 2}%` }
                    : { left: `${percentX(active) + 2}%` }
              }
            >
              {point && (
                <>
                  <p className="text-caption text-muted-foreground">{point.full}</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {series.map((item) => (
                      <li key={item.key} className="flex items-center gap-2 text-body-sm">
                        <span
                          aria-hidden
                          className="h-0.5 w-3 rounded-full"
                          style={{ backgroundColor: `var(${item.color})` }}
                        />
                        <span className="font-semibold text-foreground tabular-nums">
                          {item.values[active ?? 0] ?? 0}
                        </span>
                        <span className="text-muted-foreground">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* X axis: fewer labels on phones; the tooltip and table carry every period. */}
          <div aria-hidden className="relative mt-2 h-5 text-caption text-muted-foreground">
            {points.map((item, index) =>
              wide.has(index) ? (
                <span
                  key={item.full}
                  className={cn(
                    "absolute whitespace-nowrap",
                    index === 0
                      ? "translate-x-0"
                      : index === count - 1
                        ? "-translate-x-full"
                        : "-translate-x-1/2",
                    !narrow.has(index) && "hidden sm:inline",
                  )}
                  style={{ left: `${percentX(index)}%` }}
                >
                  {item.short}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>

      <details className="group text-body-sm">
        <summary className="w-fit cursor-pointer rounded-md text-label text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {labels.showTable}
        </summary>
        <div className="mt-3 max-h-72 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/60 text-caption text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  {labels.period}
                </th>
                {series.map((item) => (
                  <th key={item.key} scope="col" className="py-2 pr-4 text-right font-semibold">
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {points.map((item, index) => (
                <tr key={item.full}>
                  <th scope="row" className="py-1.5 pr-4 font-normal text-foreground">
                    {item.full}
                  </th>
                  {series.map((serie) => (
                    <td key={serie.key} className="py-1.5 pr-4 text-right tabular-nums">
                      {serie.values[index] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
