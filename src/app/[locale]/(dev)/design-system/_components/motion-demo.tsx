import { BookOpenIcon, FilmIcon, MicIcon, StoreIcon } from "lucide-react";

import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

const activities = [
  {
    icon: MicIcon,
    title: "Story Telling Day",
    text: "Bercerita dalam bahasa Inggris di depan teman.",
  },
  {
    icon: BookOpenIcon,
    title: "Book Day",
    text: "Membaca buku cerita bersama lalu menceritakan ulang.",
  },
  { icon: StoreIcon, title: "Market Day", text: "Simulasi jual-beli dalam bahasa Inggris." },
  { icon: FilmIcon, title: "Movie Day", text: "Nonton film anak, lalu kuis dan role-play." },
] as const;

const stats = [
  { value: 128, suffix: "+", label: "Unit BEC aktif" },
  { value: 42, suffix: "", label: "Kota & kabupaten" },
  { value: 5400, suffix: "+", label: "Siswa belajar" },
] as const;

/** Motion primitives in context. Scroll to see reveals; numbers count once when visible. */
export function MotionDemo() {
  return (
    <div className="flex flex-col gap-12">
      <Reveal className="flex max-w-prose flex-col gap-2">
        <p className="text-overline text-partner uppercase">Reveal</p>
        <p className="text-h4 text-foreground">Fades up 24 px once, when 20% is visible.</p>
      </Reveal>

      <div className="flex flex-col gap-4">
        <p className="text-overline text-partner uppercase">Stagger</p>
        <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activities.map(({ icon: Icon, title, text }) => (
            <StaggerItem key={title} as="li">
              <Card variant="soft" className="h-full">
                <span className="inline-flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon aria-hidden />
                </span>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{text}</CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-overline text-partner uppercase">CountUp</p>
        <dl className="grid gap-4 sm:grid-cols-3" data-testid="count-up-demo">
          {stats.map(({ value, suffix, label }) => (
            <div key={label} className="flex flex-col gap-1 rounded-xl bg-surface-warm p-6">
              <dd className="order-first text-h1 text-primary">
                <CountUp value={value} suffix={suffix} />
              </dd>
              <dt className="text-body-sm text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-overline text-partner uppercase">Page transition & scroll progress</p>
        <p className="max-w-prose text-body text-muted-foreground">
          The orange bar at the top tracks scroll position (CSS only). Navigate to the{" "}
          <Link href="/" className="font-semibold text-primary underline-offset-4 hover:underline">
            home page
          </Link>{" "}
          to see the cross-fade between routes.
        </p>
      </div>
    </div>
  );
}
