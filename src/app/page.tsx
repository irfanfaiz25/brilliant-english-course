import { siteConfig } from "@/config/site";

// Temporary placeholder until the localized home page is built (Phase 5a).
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col justify-center gap-4 px-5 py-16">
      <p className="text-overline text-partner uppercase">{siteConfig.shortName}</p>
      <h1 className="text-display text-primary">{siteConfig.name}</h1>
      <p className="max-w-prose text-body-lg text-muted-foreground">A Fun Way to Learn English.</p>
    </main>
  );
}
