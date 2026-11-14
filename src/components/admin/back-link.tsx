import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

/** "← All items" link above the header of an admin detail page. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 rounded-md text-body-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ArrowLeftIcon aria-hidden className="size-4" />
      {label}
    </Link>
  );
}
