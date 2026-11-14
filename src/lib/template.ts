/**
 * Fills `{name}` placeholders of a plain message template, e.g. labels a server page passes to a
 * client preview (`"{min}–{max} tahun"`). Unknown placeholders are left as they are.
 */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
