/** Locale-aware integer formatting shared by CountUp's server and client renders. */
export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(value));
}
