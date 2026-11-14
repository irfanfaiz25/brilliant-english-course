import Image from "next/image";
import { Fragment, type CSSProperties, type ReactNode } from "react";

import { mediaBaseUrl } from "@/features/media/service";
import { cn } from "@/lib/utils";

import type {
  RichTextBlock,
  RichTextDoc,
  RichTextHeading,
  RichTextInline,
  RichTextList,
  RichTextParagraph,
  RichTextTable,
  TextAlign,
} from "../rich-text";
import { youtubeVideoId } from "../rich-text";
import { extractHeadings } from "../service";

/** External links open in a new tab; site paths and anchors stay in place. */
const isExternal = (href: string) => /^https?:\/\//.test(href);

/** Library images can go through `next/image`; other https images are shown as they are. */
const isLibraryImage = (src: string) => src.startsWith("/") || src.startsWith(`${mediaBaseUrl}/`);

const alignClass: Record<TextAlign, string> = {
  left: "",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

function renderInline(nodes: readonly RichTextInline[] = []): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === "hardBreak") return <br key={index} />;
    let content: ReactNode = node.text;
    // Inner marks first, the link last, so a link wraps its styled text.
    const marks = [...(node.marks ?? [])].sort(
      (a, b) => Number(a.type === "link") - Number(b.type === "link"),
    );
    for (const mark of marks) {
      switch (mark.type) {
        case "bold":
          content = <strong className="font-semibold text-foreground">{content}</strong>;
          break;
        case "italic":
          content = <em>{content}</em>;
          break;
        case "underline":
          content = <u className="underline-offset-4">{content}</u>;
          break;
        case "strike":
          content = <s>{content}</s>;
          break;
        case "code":
          content = (
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
              {content}
            </code>
          );
          break;
        case "highlight":
          content = (
            <mark
              className="rounded-sm px-0.5 text-foreground"
              style={{ backgroundColor: mark.attrs.color }}
            >
              {content}
            </mark>
          );
          break;
        case "textStyle":
          content = <span style={{ color: mark.attrs.color } as CSSProperties}>{content}</span>;
          break;
        case "link": {
          const external = isExternal(mark.attrs.href);
          content = (
            <a
              href={mark.attrs.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors duration-(--duration-fast) hover:decoration-primary"
            >
              {content}
            </a>
          );
          break;
        }
      }
    }
    return <Fragment key={index}>{content}</Fragment>;
  });
}

const paragraph = (node: RichTextParagraph, key: number | string) => (
  <p key={key} className={alignClass[node.attrs?.textAlign ?? "left"]}>
    {renderInline(node.content)}
  </p>
);

const headingClass = {
  2: "mt-6 text-h3",
  3: "mt-3 text-h4",
  4: "mt-2 text-h5",
} as const;

function list(node: RichTextList, key: number | string): ReactNode {
  const items = node.content.map((item, index) => (
    <li key={index} className="pl-1.5 [&>*+*]:mt-2">
      {item.content.map((child, childIndex) =>
        child.type === "paragraph" ? paragraph(child, childIndex) : list(child, childIndex),
      )}
    </li>
  ));
  return node.type === "bulletList" ? (
    <ul key={key} className="flex list-disc flex-col gap-2.5 pl-6 marker:text-partner">
      {items}
    </ul>
  ) : (
    <ol
      key={key}
      start={node.attrs?.start}
      className="flex list-decimal flex-col gap-2.5 pl-6 marker:font-semibold marker:text-primary"
    >
      {items}
    </ol>
  );
}

function table(node: RichTextTable, key: number): ReactNode {
  return (
    // Wide tables scroll inside their frame instead of widening the page on phones.
    <div key={key} className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-body">
        <tbody>
          {node.content.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border last:border-b-0">
              {row.content.map((cell, cellIndex) => {
                const Cell = cell.type === "tableHeader" ? "th" : "td";
                return (
                  <Cell
                    key={cellIndex}
                    colSpan={cell.attrs?.colspan}
                    rowSpan={cell.attrs?.rowspan}
                    className={cn(
                      "min-w-28 border-r border-border px-4 py-3 align-top last:border-r-0 [&>p+p]:mt-2",
                      cell.type === "tableHeader" && "bg-surface font-semibold text-foreground",
                    )}
                  >
                    {cell.content.map((child, childIndex) => paragraph(child, childIndex))}
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Server-rendered article body from the stored rich-text JSON (`rich-text.ts`; documents are
 * sanitized before they are stored). Typography and colors come from tokens; heading ids match
 * `extractHeadings` for the table of contents.
 */
export function RichText({
  doc,
  className,
  youtubeTitle = "YouTube",
}: {
  doc: RichTextDoc;
  className?: string;
  /** Accessible name of embedded videos. */
  youtubeTitle?: string;
}) {
  const headingIds = new Map(
    extractHeadings(doc).map((heading, index) => [index, heading.id] as const),
  );
  let tocIndex = 0;

  /** `inToc`: a top-level h2/h3, which `extractHeadings` lists (quotes' headings are not). */
  const heading = (block: RichTextHeading, key: number, inToc = true) => {
    const id = inToc && block.attrs.level !== 4 ? headingIds.get(tocIndex++) : undefined;
    const Tag = `h${block.attrs.level}` as "h2" | "h3" | "h4";
    return (
      <Tag
        key={key}
        id={id}
        className={cn(
          "scroll-mt-28 text-foreground",
          headingClass[block.attrs.level],
          alignClass[block.attrs.textAlign ?? "left"],
        )}
      >
        {renderInline(block.content)}
      </Tag>
    );
  };

  const renderBlock = (block: RichTextBlock, key: number): ReactNode => {
    switch (block.type) {
      case "paragraph":
        return paragraph(block, key);
      case "heading":
        return heading(block, key);
      case "bulletList":
      case "orderedList":
        return list(block, key);
      case "blockquote":
        return (
          <blockquote
            key={key}
            className="my-2 flex flex-col gap-3 rounded-r-2xl border-l-4 border-partner bg-partner-soft/50 px-5 py-4 text-h5 font-medium text-foreground italic"
          >
            {block.content.map((child, childIndex) =>
              child.type === "paragraph"
                ? paragraph(child, childIndex)
                : child.type === "heading"
                  ? heading(child, childIndex, false)
                  : list(child, childIndex),
            )}
          </blockquote>
        );
      case "codeBlock":
        return (
          <pre
            key={key}
            className="overflow-x-auto rounded-xl bg-foreground px-5 py-4 font-mono text-body-sm text-background"
          >
            <code>{block.content?.[0]?.text ?? ""}</code>
          </pre>
        );
      case "horizontalRule":
        return <hr key={key} className="my-4 border-border" />;
      case "image": {
        const { src, alt, title, width, height } = block.attrs;
        return (
          <figure key={key} className="my-2 flex flex-col gap-2">
            {width && height && isLibraryImage(src) ? (
              <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                sizes="(min-width: 1024px) 720px, 100vw"
                className="h-auto w-full rounded-2xl"
              />
            ) : (
              // An image from another site: no optimizer (its domain is not configured).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt} loading="lazy" className="h-auto w-full rounded-2xl" />
            )}
            {title && (
              <figcaption className="text-center text-body-sm text-muted-foreground">
                {title}
              </figcaption>
            )}
          </figure>
        );
      }
      case "youtube": {
        const { start } = block.attrs;
        const videoId = youtubeVideoId(block.attrs.src);
        if (!videoId) return null;
        return (
          <div key={key} className="my-2 aspect-video overflow-hidden rounded-2xl bg-muted">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}${start ? `?start=${start}` : ""}`}
              title={youtubeTitle}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="size-full"
            />
          </div>
        );
      }
      case "table":
        return table(block, key);
    }
  };

  return (
    <div className={cn("flex flex-col gap-5 text-body-lg text-muted-foreground", className)}>
      {doc.content.map(renderBlock)}
    </div>
  );
}
