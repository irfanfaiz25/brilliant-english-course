import type {
  RichTextBlock,
  RichTextDoc,
  RichTextInline,
  RichTextMark,
  RichTextParagraph,
} from "./schema";

/**
 * Tiny builders for rich-text documents, used by fixtures and tests so content stays readable.
 * The admin editor (Phase 4e) produces the same JSON shape.
 */
type Part = string | RichTextInline;

const toInline = (part: Part): RichTextInline =>
  typeof part === "string" ? { type: "text", text: part } : part;

const marked = (text: string, mark: RichTextMark): RichTextInline => ({
  type: "text",
  text,
  marks: [mark],
});

export const bold = (text: string) => marked(text, { type: "bold" });
export const italic = (text: string) => marked(text, { type: "italic" });
export const link = (text: string, href: string) => marked(text, { type: "link", attrs: { href } });

export const p = (...parts: Part[]): RichTextParagraph => ({
  type: "paragraph",
  content: parts.map(toInline),
});

export const h2 = (text: string): RichTextBlock => ({
  type: "heading",
  attrs: { level: 2 },
  content: [{ type: "text", text }],
});

export const h3 = (text: string): RichTextBlock => ({
  type: "heading",
  attrs: { level: 3 },
  content: [{ type: "text", text }],
});

const items = (entries: (Part | Part[])[]) =>
  entries.map((entry) => ({
    type: "listItem" as const,
    content: [p(...(Array.isArray(entry) ? entry : [entry]))],
  }));

export const ul = (...entries: (Part | Part[])[]): RichTextBlock => ({
  type: "bulletList",
  content: items(entries),
});

export const ol = (...entries: (Part | Part[])[]): RichTextBlock => ({
  type: "orderedList",
  content: items(entries),
});

export const quote = (...parts: Part[]): RichTextBlock => ({
  type: "blockquote",
  content: [p(...parts)],
});

export const doc = (...content: RichTextBlock[]): RichTextDoc => ({ type: "doc", content });
