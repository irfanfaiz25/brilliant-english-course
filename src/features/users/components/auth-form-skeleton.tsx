import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder with the auth forms' footprint while URL-dependent parts stream in (no layout shift). */
export function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-5">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
