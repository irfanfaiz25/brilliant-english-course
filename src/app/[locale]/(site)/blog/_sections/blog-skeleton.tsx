import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched placeholder while the URL-dependent listing streams in (no layout shift). */
export function BlogSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-8">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-[30rem] w-full rounded-3xl lg:h-96" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[26rem] w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
