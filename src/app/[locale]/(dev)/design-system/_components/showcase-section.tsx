import type { ReactNode } from "react";

/** Section wrapper for the internal design preview. */
export function ShowcaseSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 border-t border-border py-12"
    >
      <div className="mb-8 flex flex-col gap-2">
        <h2 id={`${id}-title`} className="text-h3 text-foreground">
          {title}
        </h2>
        {description && (
          <p className="max-w-prose text-body text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
