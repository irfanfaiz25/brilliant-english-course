import { CheckCircle2Icon, SearchIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Mini mockups for the "how to join" stepper. Decorative illustrations of each step (the real
 * content is in the step text), so they are hidden from assistive tech. Their parts rise in with
 * CSS each time a preview mounts.
 */

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

function MockCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-lg sm:p-5", className)}
    >
      {children}
    </div>
  );
}

export function SearchPreview({
  query,
  count,
  name,
  meta,
  status,
}: {
  query: string;
  count: string;
  name: string;
  meta: string;
  status: string;
}) {
  return (
    <MockCard>
      <div className="flex h-11 items-center gap-2 rounded-xl bg-surface px-3 text-body-sm text-foreground">
        <SearchIcon className="size-4 text-muted-foreground" />
        {query}
        <span className="-ml-1.5 h-4 w-0.5 animate-caret bg-primary" />
      </div>
      <p style={delay(150)} className="animate-rise-in text-caption text-muted-foreground">
        {count}
      </p>
      {[0, 1].map((row) => (
        <div
          key={row}
          style={delay(250 + row * 120)}
          className={cn(
            "flex animate-rise-in items-center gap-3 rounded-xl border border-border/60 p-3",
            row === 1 && "opacity-60",
          )}
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-caption font-bold text-inverse-foreground">
            {row === 0 ? "CI" : "SU"}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label text-foreground">
              {row === 0 ? name : "Unit Sukamaju"}
            </span>
            <span className="truncate text-caption text-muted-foreground">{meta}</span>
          </span>
          {row === 0 && (
            <Badge variant="success" dot>
              {status}
            </Badge>
          )}
        </div>
      ))}
    </MockCard>
  );
}

export function ChatPreview({
  name,
  status,
  parent,
  admin,
  time,
}: {
  name: string;
  status: string;
  parent: string;
  admin: string;
  time: string;
}) {
  return (
    <MockCard className="gap-0 overflow-hidden p-0 sm:p-0">
      <div className="flex items-center gap-3 bg-whatsapp px-4 py-3 text-whatsapp-foreground">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-white/25">
          <BrandIcon name="whatsapp" className="size-5" />
        </span>
        <span className="flex flex-col">
          <span className="text-label">{name}</span>
          <span className="text-caption opacity-90">{status}</span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5 bg-surface-warm p-4">
        <p
          style={delay(100)}
          className="max-w-[85%] animate-rise-in self-end rounded-2xl rounded-br-sm bg-success-soft px-3.5 py-2.5 text-body-sm text-foreground shadow-sm"
        >
          {parent}
          <span className="mt-1 block text-right text-caption text-muted-foreground">{time}</span>
        </p>
        <p
          style={delay(650)}
          className="max-w-[85%] animate-rise-in self-start rounded-2xl rounded-bl-sm bg-card px-3.5 py-2.5 text-body-sm text-foreground shadow-sm"
        >
          {admin}
          <span className="mt-1 block text-right text-caption text-muted-foreground">{time}</span>
        </p>
      </div>
    </MockCard>
  );
}

export function PlacementPreview({
  title,
  skills,
  level,
  start,
}: {
  title: string;
  skills: readonly { label: string; percent: number }[];
  level: string;
  start: string;
}) {
  return (
    <MockCard>
      <p className="text-overline text-muted-foreground uppercase">{title}</p>
      <ul className="flex flex-col gap-3">
        {skills.map((skill, index) => (
          <li key={skill.label} className="flex flex-col gap-1.5">
            <span className="flex justify-between text-caption text-foreground">
              {skill.label}
              <span className="text-muted-foreground">{skill.percent}%</span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span
                style={{ width: `${skill.percent}%`, ...delay(150 + index * 150) }}
                className="block h-full origin-left animate-grow-x rounded-full bg-gradient-brand"
              />
            </span>
          </li>
        ))}
      </ul>
      <div
        style={delay(700)}
        className="flex animate-rise-in flex-col gap-1.5 rounded-xl bg-primary-soft p-3"
      >
        <span className="inline-flex items-center gap-2 text-label text-primary">
          <CheckCircle2Icon className="size-4" />
          {level}
        </span>
        <span className="text-caption text-muted-foreground">{start}</span>
      </div>
    </MockCard>
  );
}
