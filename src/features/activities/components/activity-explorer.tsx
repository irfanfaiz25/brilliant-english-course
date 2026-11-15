"use client";

import { useCallback, useRef, useSyncExternalStore, type MouseEvent } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import type { Activity } from "../schema";

import { ActivityCard } from "./activity-card";
import { ActivityDetail, type ActivityDetailLabels } from "./activity-detail";

/** Query parameter that names the open activity, e.g. `/program?kegiatan=market-day`. */
export const activityParam = "kegiatan";

/** Fired after this component changes the URL itself (`pushState` does not fire `popstate`). */
const urlChangeEvent = "bec:activity-url";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(urlChangeEvent, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(urlChangeEvent, onChange);
  };
}

const readSlug = () => new URLSearchParams(window.location.search).get(activityParam);

/** The current page's URL with the activity parameter set (or removed, for `null`). */
function hrefFor(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set(activityParam, slug);
  else url.searchParams.delete(activityParam);
  return `${url.pathname}${url.search}${url.hash}`;
}

type ActivityExplorerProps = {
  activities: readonly Activity[];
  /** Pre-filled WhatsApp link per activity slug. */
  whatsappUrls: Readonly<Record<string, string>>;
  showFindUnit: boolean;
  openLabel: string;
  detailLabels: ActivityDetailLabels;
};

/**
 * Activity cards that open their detail in a popup (ADR-042). The open activity lives in the URL
 * (`?kegiatan=slug`): a shared link opens it straight away, opening pushes a history entry so the
 * browser's back button closes it, and closing an activity that came with the link only removes
 * the parameter. Cards are real links to that URL, so they also work in a new tab.
 */
export function ActivityExplorer({
  activities,
  whatsappUrls,
  showFindUnit,
  openLabel,
  detailLabels,
}: ActivityExplorerProps) {
  const slug = useSyncExternalStore(subscribe, readSlug, () => null);
  const open = activities.find((activity) => activity.slug === slug);
  // Whether the open popup added its own history entry (then closing goes back to it).
  const pushed = useRef(false);

  const show = useCallback((next: string | null, mode: "push" | "replace") => {
    window.history[mode === "push" ? "pushState" : "replaceState"](
      window.history.state,
      "",
      hrefFor(next),
    );
    window.dispatchEvent(new Event(urlChangeEvent));
  }, []);

  const openActivity = (event: MouseEvent<HTMLAnchorElement>, next: string) => {
    // Let modified clicks open the link in a new tab or window.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    pushed.current = true;
    show(next, "push");
  };

  const close = () => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      show(null, "replace");
    }
  };

  return (
    <>
      <Stagger
        as="ul"
        className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:mt-14 lg:grid-cols-4"
      >
        {activities.map((activity) => (
          <StaggerItem
            key={activity.slug}
            as="li"
            className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-auto"
          >
            <ActivityCard
              activity={activity}
              detail={{
                label: openLabel,
                href: `?${activityParam}=${encodeURIComponent(activity.slug)}`,
                onClick: (event) => openActivity(event, activity.slug),
              }}
            />
          </StaggerItem>
        ))}
      </Stagger>

      <Dialog open={Boolean(open)} onOpenChange={(next) => !next && close()}>
        {open && (
          <DialogContent className="max-w-4xl gap-0 overflow-x-hidden p-0 sm:p-0 [&_[data-slot=dialog-close]]:bg-background/90 [&_[data-slot=dialog-close]]:text-foreground [&_[data-slot=dialog-close]]:shadow-sm">
            <ActivityDetail
              key={open.slug}
              activity={open}
              labels={detailLabels}
              whatsappUrl={whatsappUrls[open.slug] ?? ""}
              showFindUnit={showFindUnit}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
