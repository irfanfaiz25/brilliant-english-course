/**
 * Token swatches. Class names are spelled out (not built from strings) so Tailwind can see them.
 */

const palettes = [
  {
    name: "teal",
    shades: [
      ["50", "bg-teal-50"],
      ["100", "bg-teal-100"],
      ["200", "bg-teal-200"],
      ["300", "bg-teal-300"],
      ["400", "bg-teal-400"],
      ["500", "bg-teal-500"],
      ["600", "bg-teal-600"],
      ["700", "bg-teal-700"],
      ["800", "bg-teal-800"],
      ["900", "bg-teal-900"],
    ],
  },
  {
    name: "orange",
    shades: [
      ["50", "bg-orange-50"],
      ["100", "bg-orange-100"],
      ["200", "bg-orange-200"],
      ["300", "bg-orange-300"],
      ["400", "bg-orange-400"],
      ["500", "bg-orange-500"],
      ["600", "bg-orange-600"],
      ["700", "bg-orange-700"],
      ["800", "bg-orange-800"],
      ["900", "bg-orange-900"],
    ],
  },
  {
    name: "sunny",
    shades: [
      ["50", "bg-sunny-50"],
      ["100", "bg-sunny-100"],
      ["200", "bg-sunny-200"],
      ["300", "bg-sunny-300"],
      ["400", "bg-sunny-400"],
      ["500", "bg-sunny-500"],
      ["600", "bg-sunny-600"],
      ["700", "bg-sunny-700"],
      ["800", "bg-sunny-800"],
      ["900", "bg-sunny-900"],
    ],
  },
  {
    name: "neutral",
    shades: [
      ["50", "bg-neutral-50"],
      ["100", "bg-neutral-100"],
      ["200", "bg-neutral-200"],
      ["300", "bg-neutral-300"],
      ["400", "bg-neutral-400"],
      ["500", "bg-neutral-500"],
      ["600", "bg-neutral-600"],
      ["700", "bg-neutral-700"],
      ["800", "bg-neutral-800"],
      ["900", "bg-neutral-900"],
    ],
  },
] as const;

const semanticColors = [
  ["primary", "bg-primary", "Main actions, navigation"],
  ["partner", "bg-partner", "Partnership CTAs"],
  ["highlight", "bg-highlight", "Badges, decoration"],
  ["whatsapp", "bg-whatsapp", "WhatsApp actions"],
  ["success", "bg-success", "Available, done"],
  ["warning", "bg-warning", "Few slots left"],
  ["destructive", "bg-destructive", "Full, errors"],
  ["info", "bg-info", "New, hints"],
  ["surface", "bg-surface", "Section background"],
  ["surface-warm", "bg-surface-warm", "Warm section background"],
] as const;

const typeScale = [
  ["display", "text-display", "A Fun Way to Learn English"],
  ["h1", "text-h1", "Kursus Bahasa Inggris Anak"],
  ["h2", "text-h2", "Program Unggulan BEC"],
  ["h3", "text-h3", "Cek Unit BEC Terdekat"],
  ["h4", "text-h4", "Story Telling Day"],
  ["h5", "text-h5", "BEC Unit Sukamaju"],
  ["body-lg", "text-body-lg", "Belajar conversation & grammar dari level dasar."],
  ["body", "text-body", "Kelas Kindy, Intro, dan Secondary dengan metode yang menyenangkan."],
  ["body-sm", "text-body-sm", "Jl. Merdeka No. 12, Kec. Sukamaju, Kab. Bogor"],
  ["caption", "text-caption", "Data wilayah mengikuti Kemendagri"],
  ["label", "text-label", "Pilih Kecamatan"],
  ["overline", "text-overline uppercase", "Program BEC"],
] as const;

const radii = [
  ["xs", "rounded-xs"],
  ["sm", "rounded-sm"],
  ["md", "rounded-md"],
  ["lg", "rounded-lg"],
  ["xl", "rounded-xl"],
  ["2xl", "rounded-2xl"],
  ["full", "rounded-full"],
] as const;

const shadows = [
  ["sm", "shadow-sm"],
  ["md", "shadow-md"],
  ["lg", "shadow-lg"],
  ["brand", "shadow-brand"],
] as const;

export function ColorSwatches() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {semanticColors.map(([name, className, usage]) => (
          <div key={name} className="flex flex-col gap-2">
            <div className={`h-16 rounded-lg border border-border/60 ${className}`} />
            <p className="text-label text-foreground">{name}</p>
            <p className="text-caption text-muted-foreground">{usage}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {palettes.map((palette) => (
          <div key={palette.name} className="flex flex-col gap-2">
            <p className="text-label text-foreground capitalize">{palette.name}</p>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
              {palette.shades.map(([shade, className]) => (
                <div key={shade} className="flex flex-col gap-1">
                  <div className={`h-12 rounded-sm ${className}`} />
                  <span className="text-caption text-muted-foreground">{shade}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TypeScale() {
  return (
    <dl className="flex flex-col divide-y divide-border">
      {typeScale.map(([name, className, sample]) => (
        <div key={name} className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr] sm:items-baseline">
          <dt className="text-caption text-muted-foreground">{name}</dt>
          <dd className={`${className} text-foreground`}>{sample}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RadiusAndShadow() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="flex flex-wrap gap-4">
        {radii.map(([name, className]) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <div className={`size-16 border-2 border-primary bg-primary-soft ${className}`} />
            <span className="text-caption text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-6">
        {shadows.map(([name, className]) => (
          <div key={name} className="flex flex-col items-center gap-3">
            <div className={`size-20 rounded-xl bg-card ${className}`} />
            <span className="text-caption text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
