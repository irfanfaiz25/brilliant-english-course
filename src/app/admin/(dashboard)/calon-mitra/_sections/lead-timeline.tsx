import {
  ArrowRightLeftIcon,
  CircleCheckIcon,
  InboxIcon,
  MapPinPlusIcon,
  MessageSquareTextIcon,
  PencilIcon,
  TrashIcon,
  UserRoundCheckIcon,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { adminLocale } from "@/config/admin-routes";
import type { LeadTimelineEntry } from "@/features/partners/admin-queries";
import { leadStatuses, type LeadStatus } from "@/features/partners/schema";

type Change = { from?: unknown; to?: unknown };
type Line = { icon: ReactNode; text: string };
type Item = { entry: LeadTimelineEntry; lines: Line[] };

const isStatus = (value: unknown): value is LeadStatus =>
  typeof value === "string" && (leadStatuses as readonly string[]).includes(value);

/**
 * The lead's history, newest first: staff notes as quotes and recorded changes as short lines
 * ("Status: Baru → Dihubungi"), each with who and when.
 */
export async function LeadTimeline({
  receivedAt,
  entries,
  staffNames,
}: {
  /** When the application came in: always the first entry, also for leads without audit rows. */
  receivedAt: Date;
  entries: readonly LeadTimelineEntry[];
  /** Names of staff ids that may appear in assignment changes. */
  staffNames: ReadonlyMap<string, string>;
}) {
  const [t, tStatus, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminLeads" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.leadStatus" }),
    getFormatter({ locale: adminLocale }),
  ]);

  /** The lines an audit event shows; empty when there is nothing worth showing. */
  const describe = (entry: Extract<LeadTimelineEntry, { kind: "event" }>) => {
    const changes = entry.changes ?? {};
    const lines: Line[] = [];
    switch (entry.action) {
      case "lead.create":
        // Shown from `receivedAt` instead, so seeded leads have it too.
        break;
      case "lead.convert":
        lines.push({ icon: <CircleCheckIcon />, text: t("events.converted") });
        break;
      case "lead.delete":
        lines.push({ icon: <TrashIcon />, text: t("events.deleted") });
        break;
      case "lead.update": {
        const status = changes.status as Change | undefined;
        if (status && isStatus(status.from) && isStatus(status.to)) {
          lines.push({
            icon: <ArrowRightLeftIcon />,
            text: t("events.status", { from: tStatus(status.from), to: tStatus(status.to) }),
          });
        }
        const assigned = changes.assignedToId as Change | undefined;
        if (assigned) {
          const name = typeof assigned.to === "string" ? staffNames.get(assigned.to) : undefined;
          lines.push({
            icon: <UserRoundCheckIcon />,
            text: assigned.to
              ? t("events.assigned", { name: name ?? "—" })
              : t("events.unassigned"),
          });
        }
        if (changes.reservation === "held") {
          lines.push({ icon: <MapPinPlusIcon />, text: t("events.reservationHeld") });
        }
        if (changes.reservation === "released") {
          lines.push({ icon: <MapPinPlusIcon />, text: t("events.reservationReleased") });
        }
        break;
      }
      default:
        lines.push({ icon: <PencilIcon />, text: t("events.updated") });
    }
    return lines;
  };

  const received: Item = {
    entry: {
      kind: "event",
      id: "received",
      at: receivedAt,
      author: null,
      action: "",
      changes: null,
    },
    lines: [{ icon: <InboxIcon />, text: t("events.created") }],
  };
  const items = [
    ...entries.flatMap((entry): Item[] => {
      if (entry.kind === "note") return [{ entry, lines: [] }];
      const lines = describe(entry);
      return lines.length > 0 ? [{ entry, lines }] : [];
    }),
    received,
  ];

  return (
    <ol className="relative flex flex-col gap-5 border-l border-border/70 pl-6">
      {items.map(({ entry, lines }) => (
        <li key={`${entry.kind}-${entry.id}`} className="relative flex flex-col gap-1.5">
          <span
            aria-hidden
            className="absolute top-0.5 -left-[2.0625rem] flex size-6 items-center justify-center rounded-full border border-border/70 bg-background text-primary [&_svg]:size-3.5"
          >
            {entry.kind === "note" ? <MessageSquareTextIcon /> : lines[0]?.icon}
          </span>
          {entry.kind === "note" ? (
            <blockquote className="rounded-xl bg-background/70 px-4 py-3 text-body-sm whitespace-pre-line text-foreground">
              {entry.body}
            </blockquote>
          ) : (
            lines.map((line) => (
              <p key={line.text} className="text-body-sm font-medium text-foreground">
                {line.text}
              </p>
            ))
          )}
          <p className="text-caption text-muted-foreground">
            <time dateTime={entry.at.toISOString()}>
              {format.dateTime(entry.at, {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Jakarta",
              })}
            </time>{" "}
            · {entry.author ? t("history.by", { name: entry.author }) : t("history.system")}
          </p>
        </li>
      ))}
    </ol>
  );
}
