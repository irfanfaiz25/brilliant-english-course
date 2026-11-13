"use client";

import { LocateFixedIcon, Loader2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { finderQuery } from "@/features/units/finder-params";
import { cn } from "@/lib/utils";

import { useFinder } from "./finder-shell";

type LocationButtonProps = {
  active: boolean;
  /** The visitor arrived via a "use my location" link: draw attention without auto-prompting. */
  highlight: boolean;
  /** Params to keep (search text); the region filter is dropped in favour of distance. */
  keep: { query?: string };
  labels: {
    use: string;
    locating: string;
    active: string;
    clear: string;
    hint: string;
    denied: string;
    unavailable: string;
  };
};

/**
 * "Use my location": asks for the position only on tap (never on page load), rounds it to
 * ~100 m and puts it in the URL so the server sorts units by distance.
 */
export function LocationButton({ active, highlight, keep, labels }: LocationButtonProps) {
  const { navigate } = useFinder();
  const [locating, setLocating] = useState(false);

  if (active) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-primary-soft px-3 py-2 text-label text-primary">
        <span className="inline-flex items-center gap-2">
          <LocateFixedIcon aria-hidden className="size-4" />
          {labels.active}
        </span>
        <button
          type="button"
          onClick={() => navigate(finderQuery(keep))}
          className="inline-flex size-8 items-center justify-center rounded-full transition-colors duration-(--duration-fast) hover:bg-primary/10"
        >
          <XIcon aria-hidden className="size-4" />
          <span className="sr-only">{labels.clear}</span>
        </button>
      </div>
    );
  }

  const locate = () => {
    if (!("geolocation" in navigator)) {
      toast.error(labels.unavailable);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        navigate(
          finderQuery({
            ...keep,
            near: { lat: position.coords.latitude, lng: position.coords.longitude },
          }),
        );
      },
      (error) => {
        setLocating(false);
        toast.error(error.code === error.PERMISSION_DENIED ? labels.denied : labels.unavailable);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={locate}
        loading={locating}
        className={cn("w-full", highlight && "ring-4 ring-primary-soft motion-safe:animate-pulse")}
      >
        {locating ? <Loader2Icon aria-hidden /> : <LocateFixedIcon aria-hidden />}
        {locating ? labels.locating : labels.use}
      </Button>
      {highlight && <p className="text-caption text-muted-foreground">{labels.hint}</p>}
    </div>
  );
}
