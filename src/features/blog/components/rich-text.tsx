import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { RichTextBlock, RichTextDoc, RichTextInline, RichTextParagraph } from "../schema";
import { extractHeadings } from "../service";

/** External links open in a new tab; site paths and anchors stay in place. */
const isExternal = (href: string) => /^https?:\/\//.test(href);

function renderInline(nodes: readonly RichTextInline[] = []): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === "hardBreak") return <br key={index} />;
    let content: ReactNode = node.text;
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") {
        content = <strong className="font-semibold text-foreground">{content}</strong>;
      } else if (mark.type === "italic") {
        content = <em>{content}</em>;
      } else {
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
      }
    }
    return <Fragment key={index}>{content}</Fragment>;
  });
}

const paragraph = (node: RichTextParagraph, key: number | string, className?: string) => (
  <p key={key} className={className}>
    {renderInline(node.content)}
  </p>
);

const listItemClass = "pl-1.5 [&>p+p]:mt-2";

/**
 * Server-rendered article body from the stored rich-text JSON (the Tiptap subset in `schema.ts`).
 * Typography comes from tokens; heading ids match `extractHeadings` for the table of contents.
 */
export function RichText({ doc, className }: { doc: RichTextDoc; className?: string }) {
  const headingIds = extractHeadings(doc).map((heading) => heading.id);
  let headingIndex = 0;

  const renderBlock = (block: RichTextBlock, key: number): ReactNode => {
    switch (block.type) {
      case "paragraph":
        return paragraph(block, key);
      case "heading": {
        const id = headingIds[headingIndex++];
        const Tag = block.attrs.level === 2 ? "h2" : "h3";
        return (
          <Tag
            key={key}
            id={id}
            className={cn(
              "scroll-mt-28 text-foreground",
              block.attrs.level === 2 ? "mt-6 text-h3" : "mt-3 text-h4",
            )}
          >
            {renderInline(block.content)}
          </Tag>
        );
      }
      case "bulletList":
        return (
          <ul key={key} className="flex list-disc flex-col gap-2.5 pl-6 marker:text-partner">
            {block.content.map((item, index) => (
              <li key={index} className={listItemClass}>
                {item.content.map((child, childIndex) => paragraph(child, childIndex))}
              </li>
            ))}
          </ul>
        );
      case "orderedList":
        return (
          <ol
            key={key}
            className="flex list-decimal flex-col gap-2.5 pl-6 marker:font-semibold marker:text-primary"
          >
            {block.content.map((item, index) => (
              <li key={index} className={listItemClass}>
                {item.content.map((child, childIndex) => paragraph(child, childIndex))}
              </li>
            ))}
          </ol>
        );
      case "blockquote":
        return (
          <blockquote
            key={key}
            className="my-2 rounded-r-2xl border-l-4 border-partner bg-partner-soft/50 px-5 py-4 text-h5 font-medium text-foreground italic"
          >
            {block.content.map((child, childIndex) => paragraph(child, childIndex))}
          </blockquote>
        );
    }
  };

  return (
    <div className={cn("flex flex-col gap-5 text-body-lg text-muted-foreground", className)}>
      {doc.content.map(renderBlock)}
    </div>
  );
}
