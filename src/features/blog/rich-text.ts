/*
 * The blog's rich-text model: the subset of Tiptap's JSON document the editor may produce, and
 * `sanitizeDoc()`, which keeps exactly that subset. Every write and every render goes through it,
 * so a document pasted, imported as HTML or crafted by hand can never put unknown markup, script
 * URLs or off-brand colors on the site. Pure module: runs in the browser and on the server.
 */

/** Text colors the editor offers: brand tokens strong enough for body text on white. */
export const textColors = {
  primary: "var(--color-primary)",
  partner: "var(--color-partner-strong)",
  kindy: "var(--color-level-kindy-strong)",
  intro: "var(--color-level-intro-strong)",
  secondary: "var(--color-level-secondary-strong)",
  red: "var(--color-destructive-strong)",
  green: "var(--color-success-strong)",
  blue: "var(--color-info-strong)",
  gray: "var(--color-muted-foreground)",
} as const;

/** Highlight (marker) colors: soft brand tokens that keep the text readable. */
export const highlightColors = {
  yellow: "var(--color-highlight-soft)",
  partner: "var(--color-partner-soft)",
  kindy: "var(--color-level-kindy-soft)",
  intro: "var(--color-level-intro-soft)",
  green: "var(--color-success-soft)",
  blue: "var(--color-info-soft)",
} as const;

export type TextColor = (typeof textColors)[keyof typeof textColors];
export type HighlightColor = (typeof highlightColors)[keyof typeof highlightColors];

export const textAligns = ["left", "center", "right", "justify"] as const;
export type TextAlign = (typeof textAligns)[number];

/** Heading levels inside an article; the page title is its only `h1`. */
export const headingLevels = [2, 3, 4] as const;
export type HeadingLevel = (typeof headingLevels)[number];

export type RichTextMark =
  | { type: "bold" | "italic" | "underline" | "strike" | "code" }
  | { type: "link"; attrs: { href: string } }
  | { type: "highlight"; attrs: { color: HighlightColor } }
  | { type: "textStyle"; attrs: { color: TextColor } };

export type RichTextText = { type: "text"; text: string; marks?: RichTextMark[] };
export type RichTextInline = RichTextText | { type: "hardBreak" };

type Aligned = { attrs?: { textAlign: TextAlign } };

export type RichTextParagraph = { type: "paragraph"; content?: RichTextInline[] } & Aligned;
export type RichTextHeading = {
  type: "heading";
  attrs: { level: HeadingLevel; textAlign?: TextAlign };
  content: RichTextInline[];
};
export type RichTextList =
  | { type: "bulletList"; content: RichTextListItem[] }
  | { type: "orderedList"; attrs?: { start: number }; content: RichTextListItem[] };
export type RichTextListItem = {
  type: "listItem";
  content: (RichTextParagraph | RichTextList)[];
};
export type RichTextCell = {
  type: "tableCell" | "tableHeader";
  attrs?: { colspan?: number; rowspan?: number };
  content: RichTextParagraph[];
};
export type RichTextTable = {
  type: "table";
  content: { type: "tableRow"; content: RichTextCell[] }[];
};
export type RichTextImage = {
  type: "image";
  attrs: {
    src: string;
    alt: string;
    /** Shown as the caption. */
    title?: string;
    width?: number;
    height?: number;
    /** The `media_assets` row, when picked from the library (counts as a use of the image). */
    mediaId?: string;
  };
};

export type RichTextBlock =
  | RichTextParagraph
  | RichTextHeading
  | RichTextList
  | { type: "blockquote"; content: (RichTextParagraph | RichTextHeading | RichTextList)[] }
  | { type: "codeBlock"; content?: { type: "text"; text: string }[] }
  | { type: "horizontalRule" }
  | RichTextImage
  /** `src` is always the canonical watch URL (what Tiptap's YouTube node reads). */
  | { type: "youtube"; attrs: { src: string; start?: number } }
  | RichTextTable;

export type RichTextDoc = { type: "doc"; content: RichTextBlock[] };

/* -------------------------------------------------------------------------------------------- */
/* Sanitizing                                                                                    */
/* -------------------------------------------------------------------------------------------- */

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const children = (node: Json): unknown[] => (Array.isArray(node.content) ? node.content : []);
const attrsOf = (node: Json): Json => (isObject(node.attrs) ? node.attrs : {});
const oneOf = <T extends string | number>(values: readonly T[], value: unknown): T | undefined =>
  values.find((candidate) => candidate === value);
const positiveInt = (value: unknown, max: number): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= max
    ? value
    : undefined;

/** Links may point to the web, the site itself, an anchor or an email address. */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (/^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*|#[\w-]+|mailto:[^\s@]+@[^\s@]+)$/i.test(href))
    return href;
  return null;
}

/** Images come from the media library (site path or media domain) or an https address. */
export function safeImageSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const src = value.trim();
  return /^(https:\/\/[^\s]+|\/(?!\/)[^\s]+)$/i.test(src) ? src : null;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The video id of a YouTube address (watch, youtu.be, embed, shorts, nocookie), or `null`.
 * Only the id is stored; the player URL is built on render.
 */
export function youtubeVideoId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return /^[\w-]{11}$/.test(value.trim()) ? value.trim() : null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      url.searchParams.get("v") ??
      url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] ??
      null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

/** The canonical address of a YouTube video. */
export const youtubeWatchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

const textColorValues = Object.values(textColors) as readonly string[];
const highlightValues = Object.values(highlightColors) as readonly string[];

function sanitizeMarks(value: unknown): RichTextMark[] {
  if (!Array.isArray(value)) return [];
  const marks: RichTextMark[] = [];
  const seen = new Set<string>();
  for (const mark of value) {
    if (!isObject(mark) || typeof mark.type !== "string" || seen.has(mark.type)) continue;
    const attrs = attrsOf(mark);
    let clean: RichTextMark | null = null;
    switch (mark.type) {
      case "bold":
      case "italic":
      case "underline":
      case "strike":
      case "code":
        clean = { type: mark.type };
        break;
      case "link": {
        const href = safeHref(attrs.href);
        if (href) clean = { type: "link", attrs: { href } };
        break;
      }
      case "highlight":
        // A highlight without a color uses the first (yellow) one.
        clean = {
          type: "highlight",
          attrs: {
            color: (oneOf(highlightValues, attrs.color) ??
              highlightColors.yellow) as HighlightColor,
          },
        };
        break;
      case "textStyle": {
        const color = oneOf(textColorValues, attrs.color);
        if (color) clean = { type: "textStyle", attrs: { color: color as TextColor } };
        break;
      }
    }
    if (clean) {
      seen.add(clean.type);
      marks.push(clean);
    }
  }
  return marks;
}

function sanitizeInline(nodes: unknown[]): RichTextInline[] {
  const inline: RichTextInline[] = [];
  for (const node of nodes) {
    if (!isObject(node)) continue;
    if (node.type === "hardBreak") inline.push({ type: "hardBreak" });
    if (node.type === "text" && typeof node.text === "string" && node.text.length > 0) {
      const marks = sanitizeMarks(node.marks);
      inline.push(
        marks.length > 0
          ? { type: "text", text: node.text, marks }
          : { type: "text", text: node.text },
      );
    }
  }
  return inline;
}

const alignOf = (node: Json): { textAlign: TextAlign } | undefined => {
  const align = oneOf(textAligns, attrsOf(node).textAlign);
  return align && align !== "left" ? { textAlign: align } : undefined;
};

function sanitizeParagraph(node: Json): RichTextParagraph {
  const content = sanitizeInline(children(node));
  const attrs = alignOf(node);
  return {
    type: "paragraph",
    ...(attrs ? { attrs } : {}),
    ...(content.length > 0 ? { content } : {}),
  };
}

function sanitizeHeading(node: Json): RichTextHeading | null {
  const content = sanitizeInline(children(node));
  if (content.length === 0) return null;
  // Old or imported documents may hold h1/h5/h6: clamp them into the article's outline.
  const raw = attrsOf(node).level;
  const level: HeadingLevel =
    typeof raw === "number" ? (Math.min(4, Math.max(2, Math.trunc(raw))) as HeadingLevel) : 2;
  const align = alignOf(node);
  return { type: "heading", attrs: { level, ...align }, content };
}

function sanitizeList(node: Json): RichTextList | null {
  const items: RichTextListItem[] = [];
  for (const item of children(node)) {
    if (!isObject(item) || item.type !== "listItem") continue;
    const content: RichTextListItem["content"] = [];
    for (const child of children(item)) {
      if (!isObject(child)) continue;
      if (child.type === "paragraph") content.push(sanitizeParagraph(child));
      else if (child.type === "bulletList" || child.type === "orderedList") {
        const list = sanitizeList(child);
        if (list) content.push(list);
      }
    }
    if (content.length > 0) items.push({ type: "listItem", content });
  }
  if (items.length === 0) return null;
  if (node.type === "orderedList") {
    const start = positiveInt(attrsOf(node).start, 10_000);
    return {
      type: "orderedList",
      ...(start && start > 1 ? { attrs: { start } } : {}),
      content: items,
    };
  }
  return { type: "bulletList", content: items };
}

function sanitizeTable(node: Json): RichTextTable | null {
  const rows: RichTextTable["content"] = [];
  for (const row of children(node)) {
    if (!isObject(row) || row.type !== "tableRow") continue;
    const cells: RichTextCell[] = [];
    for (const cell of children(row)) {
      if (!isObject(cell) || (cell.type !== "tableCell" && cell.type !== "tableHeader")) continue;
      const attrs = attrsOf(cell);
      const colspan = positiveInt(attrs.colspan, 20);
      const rowspan = positiveInt(attrs.rowspan, 50);
      const paragraphs = children(cell)
        .filter((child): child is Json => isObject(child) && child.type === "paragraph")
        .map(sanitizeParagraph);
      cells.push({
        type: cell.type,
        ...((colspan && colspan > 1) || (rowspan && rowspan > 1)
          ? {
              attrs: {
                ...(colspan && colspan > 1 ? { colspan } : {}),
                ...(rowspan && rowspan > 1 ? { rowspan } : {}),
              },
            }
          : {}),
        content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }],
      });
    }
    if (cells.length > 0) rows.push({ type: "tableRow", content: cells });
  }
  return rows.length > 0 ? { type: "table", content: rows } : null;
}

function sanitizeBlock(node: unknown): RichTextBlock | null {
  if (!isObject(node)) return null;
  const attrs = attrsOf(node);
  switch (node.type) {
    case "paragraph":
      return sanitizeParagraph(node);
    case "heading":
      return sanitizeHeading(node);
    case "bulletList":
    case "orderedList":
      return sanitizeList(node);
    case "blockquote": {
      const content = children(node).flatMap((child) => {
        const block = sanitizeBlock(child);
        return block &&
          (block.type === "paragraph" ||
            block.type === "heading" ||
            block.type === "bulletList" ||
            block.type === "orderedList")
          ? [block]
          : [];
      });
      return content.length > 0 ? { type: "blockquote", content } : null;
    }
    case "codeBlock": {
      const text = children(node)
        .map((child) => (isObject(child) && typeof child.text === "string" ? child.text : ""))
        .join("");
      return { type: "codeBlock", ...(text ? { content: [{ type: "text", text }] } : {}) };
    }
    case "horizontalRule":
      return { type: "horizontalRule" };
    case "image": {
      const src = safeImageSrc(attrs.src);
      if (!src) return null;
      const width = positiveInt(attrs.width, 10_000);
      const height = positiveInt(attrs.height, 10_000);
      const title = typeof attrs.title === "string" ? attrs.title.trim().slice(0, 200) : "";
      const mediaId =
        typeof attrs.mediaId === "string" && uuidPattern.test(attrs.mediaId)
          ? attrs.mediaId
          : undefined;
      return {
        type: "image",
        attrs: {
          src,
          alt: typeof attrs.alt === "string" ? attrs.alt.trim().slice(0, 200) : "",
          ...(title ? { title } : {}),
          ...(width && height ? { width, height } : {}),
          ...(mediaId ? { mediaId } : {}),
        },
      };
    }
    case "youtube": {
      const videoId = youtubeVideoId(attrs.src);
      if (!videoId) return null;
      const start = positiveInt(attrs.start, 86_400);
      return {
        type: "youtube",
        attrs: { src: youtubeWatchUrl(videoId), ...(start ? { start } : {}) },
      };
    }
    case "table":
      return sanitizeTable(node);
    default:
      return null;
  }
}

/**
 * The allowed part of a Tiptap document: unknown nodes, marks and attributes are dropped, colors
 * and links outside the allow-lists removed. Returns an empty document for anything unusable.
 */
export function sanitizeDoc(input: unknown): RichTextDoc {
  if (!isObject(input) || input.type !== "doc") return { type: "doc", content: [] };
  const content = children(input).flatMap((node) => {
    const block = sanitizeBlock(node);
    return block ? [block] : [];
  });
  return { type: "doc", content };
}

/* -------------------------------------------------------------------------------------------- */
/* Reading                                                                                       */
/* -------------------------------------------------------------------------------------------- */

/** Plain text of inline nodes (marks dropped, hard breaks as spaces). */
export function inlineText(nodes: readonly RichTextInline[] = []): string {
  return nodes.map((node) => (node.type === "text" ? node.text : " ")).join("");
}

type AnyNode = { type: string; content?: readonly unknown[]; text?: string };

function nodeText(node: AnyNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return " ";
  return (node.content ?? []).map((child) => nodeText(child as AnyNode)).join(" ");
}

/** Whole document as plain text (reading time, word count, search, meta fallbacks). */
export function documentText(doc: RichTextDoc): string {
  return doc.content
    .map((block) => nodeText(block as AnyNode))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A document has something to read (text, an image, a video or a table). */
export function hasContent(doc: RichTextDoc): boolean {
  return (
    documentText(doc) !== "" ||
    doc.content.some((block) => block.type === "image" || block.type === "youtube")
  );
}

/** Library images placed in the document (their `mediaId`s), without duplicates. */
export function documentMediaIds(doc: RichTextDoc): string[] {
  return [
    ...new Set(
      doc.content.flatMap((block) =>
        block.type === "image" && block.attrs.mediaId ? [block.attrs.mediaId] : [],
      ),
    ),
  ];
}
