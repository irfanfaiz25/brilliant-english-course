import { QuoteIcon, StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Testimonial } from "../schema";

const avatarTones = [
  "bg-level-intro-soft text-level-intro-strong",
  "bg-level-secondary-soft text-level-secondary-strong",
  "bg-level-kindy-soft text-level-kindy-strong",
] as const;

type TestimonialCardProps = {
  testimonial: Testimonial;
  ratingLabel: string;
  /** Position in the list, used to vary the avatar color. */
  index: number;
};

export function TestimonialCard({ testimonial, ratingLabel, index }: TestimonialCardProps) {
  const initials = testimonial.author.split(/\s+/).slice(-1)[0]?.slice(0, 1).toUpperCase();

  return (
    <figure className="relative flex h-full flex-col gap-5 overflow-hidden rounded-xl border border-border/60 bg-card p-6 shadow-card sm:p-7">
      <QuoteIcon
        aria-hidden
        className="absolute -top-2 -right-2 size-24 rotate-180 text-primary-soft"
      />
      <p aria-label={ratingLabel} className="flex gap-0.5 text-highlight">
        {Array.from({ length: testimonial.rating }, (_, i) => (
          <StarIcon key={i} aria-hidden className="size-4 fill-current" />
        ))}
      </p>
      <blockquote className="relative text-body-lg text-foreground">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-full text-label",
            avatarTones[index % avatarTones.length],
          )}
        >
          {initials}
        </span>
        <span className="flex flex-col">
          <span className="text-label text-foreground">{testimonial.author}</span>
          <span className="text-caption text-muted-foreground">{testimonial.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}
