import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched placeholder for the finder while the first results stream in (no layout shift). */
export function FinderSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="grid gap-8 lg:grid-cols-[22rem_1fr] lg:gap-10">
      <div className="hidden flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-card lg:flex">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-36 w-full rounded-2xl lg:hidden" />
        <Skeleton className="h-6 w-56" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
