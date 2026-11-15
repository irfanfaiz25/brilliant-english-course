"use client";

import Image from "next/image";
import { useState } from "react";

import { ItemIcon } from "@/features/partners/components/item-icon";
import type { PartnershipPage } from "@/features/partners/queries";
import type { StarterKitGroup } from "@/features/partners/page-schema";
import { fillTemplate } from "@/lib/template";
import { cn } from "@/lib/utils";

type KitItem = PartnershipPage["kit"]["items"][number];

type StarterKitExplorerProps = {
  items: KitItem[];
  labels: {
    filter: string;
    all: string;
    groups: Record<StarterKitGroup, string>;
    /** "{count} item", already pluralised per count by the server. */
    shown: string;
  };
};

/** Tone of each group's chip and icon tile. */
const groupTone: Record<StarterKitGroup, string> = {
  materials: "bg-primary-soft text-primary",
  classroom: "bg-partner-soft text-partner",
  guides: "bg-level-kindy-soft text-level-kindy-strong",
};

/**
 * The starter kit as filterable cards (ADR-041): chips narrow it to one group (with counts), and
 * every card always shows its name and description, so nothing hides behind a click. A card
 * without a photo shows its icon on a tile in the group's colour. Compact rows on phones.
 */
export function StarterKitExplorer({ items, labels }: StarterKitExplorerProps) {
  const [group, setGroup] = useState<StarterKitGroup | "all">("all");
  const groups = (Object.keys(labels.groups) as StarterKitGroup[]).filter((key) =>
    items.some((item) => item.group === key),
  );
  const visible = group === "all" ? items : items.filter((item) => item.group === group);
  const chips: { key: StarterKitGroup | "all"; label: string; count: number }[] = [
    { key: "all", label: labels.all, count: items.length },
    ...groups.map((key) => ({
      key,
      label: labels.groups[key],
      count: items.filter((item) => item.group === key).length,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label={labels.filter} className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = chip.key === group;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={active}
              onClick={() => setGroup(chip.key)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-label transition-colors duration-(--duration-fast)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active
                  ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/60 hover:text-primary",
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "inline-flex min-w-6 justify-center rounded-full px-1.5 text-caption",
                  active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
                )}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="sr-only">
        {fillTemplate(labels.shown, { count: visible.length })}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {visible.map((item) => (
          <li
            key={item.title}
            className="group flex animate-rise-in overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-[translate,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-1 hover:shadow-lg motion-reduce:animate-none sm:flex-col"
          >
            <div className="relative w-24 shrink-0 overflow-hidden sm:h-40 sm:w-auto">
              {item.image ? (
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 6rem"
                  className="object-cover transition-transform duration-(--duration-slow) ease-out group-hover:scale-105"
                />
              ) : (
                <span
                  className={cn(
                    "flex size-full items-center justify-center bg-dots",
                    groupTone[item.group],
                  )}
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-card shadow-card transition-transform duration-(--duration-base) ease-out group-hover:-rotate-6 sm:size-14 sm:rounded-2xl">
                    <ItemIcon item={item} className="size-5 sm:size-7" />
                  </span>
                </span>
              )}
              <span
                className={cn(
                  "absolute top-3 left-3 hidden rounded-full px-2.5 py-1 text-caption font-semibold shadow-sm sm:inline",
                  groupTone[item.group],
                )}
              >
                {labels.groups[item.group]}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 sm:gap-1.5 sm:p-5">
              {/* On phones the group sits above the title; from `sm` it is a badge on the photo. */}
              <span className="text-caption font-semibold text-muted-foreground sm:hidden">
                {labels.groups[item.group]}
              </span>
              <h3 className="text-h5 text-foreground">{item.title}</h3>
              {item.text && <p className="text-body-sm text-muted-foreground">{item.text}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
