import { describe, expect, it } from "vitest";

import {
  documentMediaIds,
  documentText,
  hasContent,
  highlightColors,
  safeHref,
  sanitizeDoc,
  textColors,
  youtubeVideoId,
} from "./rich-text";
import { richTextDocSchema } from "./schema";

const doc = (...content: unknown[]) => ({ type: "doc", content });
const text = (value: string, marks?: unknown[]) => ({ type: "text", text: value, marks });
const paragraph = (...content: unknown[]) => ({ type: "paragraph", content });

describe("sanitizeDoc", () => {
  it("keeps the allowed marks and drops the rest", () => {
    const result = sanitizeDoc(
      doc(
        paragraph(
          text("a", [
            { type: "bold" },
            { type: "bold" },
            { type: "underline" },
            { type: "superscript" },
            { type: "textStyle", attrs: { color: textColors.primary } },
            { type: "highlight", attrs: { color: highlightColors.green } },
          ]),
          text("b", [
            { type: "textStyle", attrs: { color: "#ff0000" } },
            { type: "highlight", attrs: { color: "red" } },
          ]),
        ),
      ),
    );
    expect(result.content[0]).toEqual({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "a",
          marks: [
            { type: "bold" },
            { type: "underline" },
            { type: "textStyle", attrs: { color: textColors.primary } },
            { type: "highlight", attrs: { color: highlightColors.green } },
          ],
        },
        // Off-palette text color removed; a highlight falls back to the default color.
        {
          type: "text",
          text: "b",
          marks: [{ type: "highlight", attrs: { color: highlightColors.yellow } }],
        },
      ],
    });
  });

  it("removes unsafe links but keeps their text", () => {
    const result = sanitizeDoc(
      doc(
        paragraph(
          text("x", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]),
          text("y", [{ type: "link", attrs: { href: "https://bec.id/a?b=1" } }]),
        ),
      ),
    );
    expect(result.content[0]).toEqual(
      paragraph(
        { type: "text", text: "x" },
        {
          type: "text",
          text: "y",
          marks: [{ type: "link", attrs: { href: "https://bec.id/a?b=1" } }],
        },
      ),
    );
    expect(safeHref("//evil.example")).toBeNull();
    expect(safeHref("/kemitraan#kuota")).toBe("/kemitraan#kuota");
    expect(safeHref("mailto:halo@bec.id")).toBe("mailto:halo@bec.id");
  });

  it("drops unknown nodes and clamps headings into h2–h4", () => {
    const result = sanitizeDoc(
      doc(
        { type: "heading", attrs: { level: 1 }, content: [text("Judul")] },
        { type: "heading", attrs: { level: 6 }, content: [text("Kecil")] },
        { type: "heading", attrs: { level: 2 }, content: [] },
        { type: "iframe", attrs: { src: "https://x" } },
        { type: "paragraph", attrs: { textAlign: "center" }, content: [text("c")] },
        { type: "paragraph", attrs: { textAlign: "left" }, content: [text("l")] },
      ),
    );
    expect(result.content).toEqual([
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Judul" }] },
      { type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: "Kecil" }] },
      { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", text: "c" }] },
      { type: "paragraph", content: [{ type: "text", text: "l" }] },
    ]);
  });

  it("keeps nested lists, tables, code, rules, images and videos", () => {
    const mediaId = "0b6c1f0e-8c4b-4c11-9a35-6f1e2f6b3a10";
    const result = sanitizeDoc(
      doc(
        {
          type: "orderedList",
          attrs: { start: 3 },
          content: [
            {
              type: "listItem",
              content: [
                paragraph(text("satu")),
                {
                  type: "bulletList",
                  content: [{ type: "listItem", content: [paragraph(text("a"))] }],
                },
              ],
            },
          ],
        },
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  attrs: { colspan: 2, colwidth: null },
                  content: [paragraph(text("H"))],
                },
              ],
            },
          ],
        },
        { type: "codeBlock", attrs: { language: "js" }, content: [text("let a = 1;")] },
        { type: "horizontalRule" },
        {
          type: "image",
          attrs: {
            src: "/api/media/files/media/x.webp",
            alt: "Kelas",
            width: 800,
            height: 600,
            mediaId,
          },
        },
        { type: "image", attrs: { src: "javascript:alert(1)", alt: "x" } },
        { type: "youtube", attrs: { src: "https://youtu.be/dQw4w9WgXcQ", start: 30 } },
      ),
    );
    expect(result.content.map((block) => block.type)).toEqual([
      "orderedList",
      "table",
      "codeBlock",
      "horizontalRule",
      "image",
      "youtube",
    ]);
    expect(result.content[0]).toMatchObject({ attrs: { start: 3 } });
    expect(result.content[1]).toMatchObject({
      content: [{ content: [{ type: "tableHeader", attrs: { colspan: 2 } }] }],
    });
    expect(result.content[5]).toEqual({
      type: "youtube",
      attrs: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", start: 30 },
    });
    expect(documentMediaIds(result)).toEqual([mediaId]);
  });

  it("returns an empty document for anything that is not one", () => {
    expect(sanitizeDoc(null)).toEqual({ type: "doc", content: [] });
    expect(sanitizeDoc({ type: "paragraph" })).toEqual({ type: "doc", content: [] });
  });
});

describe("youtubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://vimeo.com/123", null],
    ["https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ", null],
  ])("%s → %s", (url, id) => expect(youtubeVideoId(url)).toBe(id));
});

describe("richTextDocSchema", () => {
  it("requires something to read", () => {
    expect(richTextDocSchema.safeParse(doc(paragraph())).success).toBe(false);
    expect(richTextDocSchema.safeParse(doc({ type: "horizontalRule" })).success).toBe(false);
    const parsed = richTextDocSchema.parse(
      doc(paragraph(text("Halo"), { type: "hardBreak" }, text("dunia"))),
    );
    expect(documentText(parsed)).toBe("Halo dunia");
    expect(hasContent(sanitizeDoc(doc({ type: "youtube", attrs: { src: "dQw4w9WgXcQ" } })))).toBe(
      true,
    );
  });
});
