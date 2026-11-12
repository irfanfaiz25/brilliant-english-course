import { ArrowRightIcon, BookOpenIcon, MapPinIcon, MessageCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isDesignPreviewEnabled } from "@/lib/flags";

import { ColorSwatches, RadiusAndShadow, TypeScale } from "./_components/foundations";
import { FormDemo, OverlayDemo } from "./_components/interactive-demos";
import { ShowcaseSection } from "./_components/showcase-section";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const sections = [
  ["colors", "Colors"],
  ["typography", "Typography"],
  ["shape", "Radius & shadow"],
  ["buttons", "Buttons"],
  ["badges", "Badges"],
  ["forms", "Forms"],
  ["cards", "Cards"],
  ["accordion", "Accordion"],
  ["overlays", "Overlays & feedback"],
] as const;

/**
 * Internal preview of tokens and primitives (Phase 2b). Developer-facing, so copy is inline
 * rather than in `messages/`. Disabled in production unless ENABLE_DESIGN_PREVIEW=true.
 */
export default function DesignSystemPage() {
  if (!isDesignPreviewEnabled) notFound();

  return (
    <main className="mx-auto w-full max-w-page px-5 pb-24 md:px-8">
      <header className="flex flex-col gap-4 py-12 md:py-16">
        <Badge variant="primary">Internal · not indexed</Badge>
        <h1 className="text-h1 text-foreground">BEC Design System</h1>
        <p className="max-w-prose text-body-lg text-muted-foreground">
          Tokens and UI primitives from <code>src/styles/globals.css</code> and{" "}
          <code>src/components/ui</code>. See DESIGN.md for usage rules.
        </p>
        <nav aria-label="Sections" className="flex flex-wrap gap-2 pt-2">
          {sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border border-border px-3 py-1.5 text-body-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <ShowcaseSection
        id="colors"
        title="Colors"
        description="Semantic tokens first; palette shades for decoration."
      >
        <ColorSwatches />
      </ShowcaseSection>

      <ShowcaseSection
        id="typography"
        title="Typography"
        description="Poppins, fluid from 360 px to 1440 px."
      >
        <TypeScale />
      </ShowcaseSection>

      <ShowcaseSection id="shape" title="Radius & shadow">
        <RadiusAndShadow />
      </ShowcaseSection>

      <ShowcaseSection
        id="buttons"
        title="Buttons"
        description="One primary action per view. `pop` adds the playful pressable depth — at most once per viewport."
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button pop>
              <MapPinIcon aria-hidden />
              Cek Unit Terdekat
            </Button>
            <Button variant="partner" pop>
              Gabung Mitra
            </Button>
            <Button>Daftar Sekarang</Button>
            <Button variant="partner">Gabung Mitra</Button>
            <Button variant="whatsapp">
              <MessageCircleIcon aria-hidden />
              Chat via WhatsApp
            </Button>
            <Button variant="secondary">Lihat Program</Button>
            <Button variant="ghost">Nanti saja</Button>
            <Button variant="link">
              Lihat detail level
              <ArrowRightIcon aria-hidden />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="secondary" aria-label="Lokasi">
              <MapPinIcon aria-hidden />
            </Button>
            <Button disabled>Disabled</Button>
            <Button loading>Mengirim</Button>
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="badges" title="Badges" description="Always text + color.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="kindy">Kindy</Badge>
            <Badge variant="intro">Intro</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" dot>
              Tersedia
            </Badge>
            <Badge variant="warning" dot>
              Sisa 1 slot
            </Badge>
            <Badge variant="destructive" dot>
              Penuh
            </Badge>
            <Badge variant="info" dot>
              Unit baru
            </Badge>
            <Badge variant="neutral">Semua level</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id="forms"
        title="Forms"
        description="Label above, helper or error below, ids wired by Field. Select for short lists, Combobox for long ones."
      >
        <FormDemo />
      </ShowcaseSection>

      <ShowcaseSection
        id="cards"
        title="Cards"
        description="Interactive cards lift on hover and keyboard focus."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <Card interactive>
            <div className="flex items-center justify-between">
              <Badge variant="kindy">Kindy</Badge>
              <span className="text-caption text-muted-foreground">4–6 tahun</span>
            </div>
            <CardHeader>
              <CardTitle>
                <a
                  href="#cards"
                  className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                >
                  Kenalan dengan Bahasa Inggris
                </a>
              </CardTitle>
              <CardDescription>Kenal huruf, kosakata dasar, lagu dan permainan.</CardDescription>
            </CardHeader>
            <CardFooter className="text-label text-primary">
              Lihat detail level <ArrowRightIcon aria-hidden className="size-4" />
            </CardFooter>
          </Card>
          <Card variant="soft">
            <span className="inline-flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <BookOpenIcon aria-hidden />
            </span>
            <CardHeader>
              <CardTitle>Book Day</CardTitle>
              <CardDescription>
                Membaca buku cerita bersama, lalu menceritakan ulang isinya.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card variant="warm">
            <CardHeader>
              <CardTitle>Loading state</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id="accordion"
        title="Accordion"
        description="Answers stay in the HTML for FAQ schema."
      >
        <Accordion type="single" collapsible className="flex max-w-3xl flex-col gap-3">
          <AccordionItem value="age">
            <AccordionTrigger>Mulai usia berapa anak bisa ikut kelas BEC?</AccordionTrigger>
            <AccordionContent>
              Anak bisa mulai dari usia 4 tahun di level Kindy, lalu lanjut ke Intro dan Secondary.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="schedule">
            <AccordionTrigger>Berapa kali pertemuan dalam seminggu?</AccordionTrigger>
            <AccordionContent>
              Jadwal mengikuti unit masing-masing, umumnya dua kali seminggu.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ShowcaseSection>

      <ShowcaseSection id="overlays" title="Overlays & feedback">
        <OverlayDemo />
      </ShowcaseSection>
    </main>
  );
}
