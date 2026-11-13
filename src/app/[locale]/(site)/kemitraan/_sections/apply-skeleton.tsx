import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched placeholder for the quota checker and form while the URL state streams in. */
export function ApplySkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8"
    >
      <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-[34rem] w-full rounded-3xl" />
    </div>
  );
}
