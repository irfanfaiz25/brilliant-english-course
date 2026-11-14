/**
 * One CSV cell. Quotes cells with separators, quotes or line breaks, and neutralizes text a
 * spreadsheet would run as a formula (`=`, `+`, `-`, `@`, tab, carriage return at the start),
 * since exports contain text typed by the public.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * A CSV document with a header row, CRLF line ends and a UTF-8 BOM so Excel opens accents and
 * Indonesian text correctly.
 */
export function toCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const line = (cells: readonly unknown[]) =>
    cells.map((cell) => csvCell(cell as string | number | null | undefined)).join(",");
  return `﻿${[line(header), ...rows.map(line)].join("\r\n")}\r\n`;
}
