import { notFound } from "next/navigation";

/** Sends unknown localized paths to `[locale]/not-found.tsx` so the 404 page is translated. */
export default function CatchAllPage() {
  notFound();
}
