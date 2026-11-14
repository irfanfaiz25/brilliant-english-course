/*
 * Geometry for the admin's hand-built SVG charts (ADR-037): no chart library, so these stay pure
 * and tested.
 */

/**
 * A y-axis that ends on a round number above `max`, split into `count` equal steps of 1, 2, 2.5
 * or 5 × 10^n. Counts are whole, so steps never go below 1.
 */
export function niceScale(max: number, count = 4): { max: number; ticks: number[] } {
  const target = Math.max(max, 1) / count;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const nice = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((s) => s >= target);
  const stepSize = Math.max(1, nice ?? 10 * magnitude);
  const top = stepSize * count;
  return { max: top, ticks: Array.from({ length: count + 1 }, (_, index) => index * stepSize) };
}

type Point = readonly [x: number, y: number];

/**
 * A smooth SVG path through `points` (x ascending) that never overshoots between two points
 * (monotone cubic, Fritsch–Carlson): a dip to 0 stays at 0 instead of curving below the axis.
 */
export function monotonePath(points: readonly Point[]): string {
  const n = points.length;
  if (n === 0) return "";
  const round = (value: number) => Math.round(value * 100) / 100;
  const [x0, y0] = points[0] as Point;
  if (n === 1) return `M${round(x0)},${round(y0)}`;

  const dx: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const [xa, ya] = points[i] as Point;
    const [xb, yb] = points[i + 1] as Point;
    dx.push(xb - xa);
    slopes.push((yb - ya) / (xb - xa));
  }

  // Tangents: the average slope, flattened at turning points and limited to avoid overshoot.
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0] as number;
    if (i === n - 1) return slopes[n - 2] as number;
    const before = slopes[i - 1] as number;
    const after = slopes[i] as number;
    if (before * after <= 0) return 0;
    return (
      (3 * ((dx[i - 1] as number) + (dx[i] as number))) /
      ((2 * (dx[i] as number) + (dx[i - 1] as number)) / before +
        ((dx[i] as number) + 2 * (dx[i - 1] as number)) / after)
    );
  });

  let path = `M${round(x0)},${round(y0)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const [xa, ya] = points[i] as Point;
    const [xb, yb] = points[i + 1] as Point;
    const third = (dx[i] as number) / 3;
    path += ` C${round(xa + third)},${round(ya + (tangents[i] as number) * third)} ${round(
      xb - third,
    )},${round(yb - (tangents[i + 1] as number) * third)} ${round(xb)},${round(yb)}`;
  }
  return path;
}
