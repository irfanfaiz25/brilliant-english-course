/** "245 KB", "1,2 MB" in the given locale (1 KB = 1024 bytes, like file managers). */
export function formatBytes(bytes: number, locale: string): string {
  const [value, unit] =
    bytes >= 1024 * 1024
      ? [bytes / (1024 * 1024), "megabyte"]
      : bytes >= 1024
        ? [bytes / 1024, "kilobyte"]
        : [bytes, "byte"];
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "short",
    maximumFractionDigits: value < 10 && unit !== "byte" ? 1 : 0,
  }).format(value);
}
