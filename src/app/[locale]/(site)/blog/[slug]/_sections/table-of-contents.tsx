import { ListIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { PostHeading } from "@/features/blog/service";
import { cn } from "@/lib/utils";

function HeadingLinks({ headings }: { headings: readonly PostHeading[] }) {
  return (
    <ol className="flex flex-col gap-1 border-l border-border/70">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className={cn(
              "-ml-px block border-l-2 border-transparent py-1.5 pr-2 text-body-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary",
              heading.level === 2 ? "pl-4" : "pl-7 text-caption",
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * Table of contents from the article headings: a collapsible panel above the text on phones and
 * tablets (animated both ways), a sticky list beside the text from `lg`. Plain anchors.
 */
export function TableOfContents({
  headings,
  label,
  variant,
}: {
  headings: readonly PostHeading[];
  label: string;
  variant: "inline" | "sidebar";
}) {
  if (headings.length < 2) return null;

  if (variant === "sidebar") {
    return (
      <nav aria-label={label} className="flex flex-col gap-3">
        <p className="inline-flex items-center gap-2 text-overline text-muted-foreground uppercase">
          <ListIcon aria-hidden className="size-4" />
          {label}
        </p>
        <HeadingLinks headings={headings} />
      </nav>
    );
  }

  return (
    <nav aria-label={label}>
      <Accordion type="single" collapsible>
        <AccordionItem value="toc" className="rounded-2xl shadow-card">
          {/* Sits between the h1 and the article's first h2. */}
          <AccordionTrigger headingLevel={2} className="text-label">
            <span className="inline-flex items-center gap-2">
              <ListIcon aria-hidden className="size-4 text-primary" />
              {label}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <HeadingLinks headings={headings} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </nav>
  );
}
