# DESIGN.md — BEC Design System & UX Guidelines

Source: Penpot file **BEC** → `00 · Design System` (v1.0), `01 · Website`, `02 · Dashboard`.
The Penpot design is the **brand baseline and layout direction, not a strict spec**. This document
keeps the brand (tokens below are binding) and records where we deliberately improve UX, motion
and responsiveness. When this file and Penpot disagree, this file wins; update it when a decision changes.

---

## 1. Brand & principles

Palette comes from the BEC logo: **Teal (B)**, **Orange (E)**, **Sunny (C)**. Single typeface: **Poppins**.

Personality: _playful but trustworthy_ — fun for kids, credible for parents and investors.

1. **Clarity first.** Every page has one primary action. Parents → find a unit / chat. Partners → check quota / apply.
2. **Playful, not noisy.** Rounded shapes, warm accents, the "pressable" brand shadow — used sparingly.
3. **Mobile is the main device.** Most visitors arrive from WhatsApp, Instagram and Google on phones. Design at 360 px first.
4. **Fast is a feature.** Motion and imagery never cost Core Web Vitals.
5. **Accessible by default.** WCAG 2.2 AA is the floor, not a stretch goal.

### 1.1 Visual direction — modern & elegant

- **Generous whitespace.** Sections breathe (64 → 120 px vertical); content never touches card edges (24–32 px padding).
- **Restrained color.** Teal carries the page; orange is reserved for partnership actions and small highlights; sunny is decoration only. A section uses at most one strong fill.
- **Soft surfaces, quiet borders.** White cards with `border-border/70` + `shadow-sm`, alternating with `surface` / `surface-warm` sections instead of heavy dividers.
- **Large radii, consistent.** Cards `xl`, controls `md`, chips `full` — never mixed within one component.
- **Type does the hierarchy.** Big, tight headings (Poppins 700), relaxed body (160% line height), overline labels for section context.
- **Depth is earned.** Shadows grow only on interaction (hover lift, open menu); the playful `pop` shadow is for one hero CTA per viewport.
- **Focus halos, not outlines.** Inputs show a soft 4 px `primary-soft` halo; everything else uses the 2 px `ring` outline.

### 1.2 Interactivity — purposeful, not everywhere

Make something interactive **only when it helps a visitor decide, find or act faster**. Everything else stays static
(Server Components, zero JS). Decision checklist before adding interactivity:

1. Does it answer a real question on the page (which level fits my child? is my village available? which unit is near me?)
2. Does it reduce steps or scrolling compared to static content?
3. Does it still make sense without JS (content in HTML, link fallback)?

If 1 and 2 are not both "yes", keep it static.

| Good candidates (planned)                                              | Keep static                                |
| ---------------------------------------------------------------------- | ------------------------------------------ |
| Age picker that highlights the matching level (Beranda, Program)       | Decorative illustrations and shapes        |
| Level tabs with scroll-spy (Program)                                   | Section headers, paragraphs, benefit lists |
| Region cascade + "use my location" + quota badge (Cek Unit, Kemitraan) | Testimonial text (scroll-snap is CSS only) |
| FAQ accordion                                                          | Step lists ("3 langkah", "5 langkah")      |
| Simple investment / ROI estimate (Kemitraan)                           | Footer, contact details                    |
| Multi-step partner form with progress                                  | Auto-rotating carousels (never)            |
| Blog category filter (URL-based), table of contents, reading progress  | Hover-only effects that hide information   |

Rules for interactive pieces:

- One focused interactive element per section; keep it a small client "island" inside a Server Component.
- State that matters (filters, selected region, tab) lives in the URL so it is shareable and crawlable.
- Every control gives immediate feedback (selected state, loading skeleton, toast) within 100 ms.
- Keyboard and screen-reader complete; touch targets ≥ 44 px; works with reduced motion.

---

## 2. Tokens

Implemented as Tailwind v4 `@theme` variables in `src/styles/globals.css`.

**Token rules (clean code):**

- **No raw color values** (`#hex`, `rgb()`, arbitrary `bg-[#…]`) in components, SVGs or JS. Every color is a CSS variable.
- Two layers: **palette** (`--color-teal-500`, …) holds raw values; **semantic** tokens (`--color-primary`, `--color-partner`, `--color-whatsapp`, `--color-surface`, …) point to the palette. Components use semantic tokens (`bg-primary`, `text-foreground`); palette classes only for decoration.
- A new special color (a partner brand, a campaign accent, a chart color) is added **once** as a variable in `globals.css` (palette + semantic alias), then reused. Rebranding = editing that file only.
- JS that needs a color (charts, OG images, `theme-color`) reads it from `src/lib/design-tokens.ts`, which mirrors the CSS variables — never a hard-coded hex.

### 2.1 Color

| Scale                | 50      | 100     | 200     | 300     | 400     | **500 (brand)** | 600     | 700     | 800     | 900     |
| -------------------- | ------- | ------- | ------- | ------- | ------- | --------------- | ------- | ------- | ------- | ------- |
| `teal` (primary)     | #E8F4F6 | #C7E3E8 | #93C7D0 | #5EA9B6 | #33899A | **#1B6E7E**     | #165B69 | #124A55 | #0E3942 | #0A2930 |
| `orange` (secondary) | #FFF2E8 | #FFDDC4 | #FDBA8C | #F8964F | #EE7A26 | **#DD6510**     | #B8520B | #924109 | #6E3107 | #4A2105 |
| `sunny` (accent)     | #FFF8E9 | #FFEDC7 | #FFDB8F | #FDC659 | #F9B23A | **#F5A02A**     | #D9861A | #B06A12 | #84500E | #5A3609 |
| `neutral`            | #F8FAFB | #F1F4F6 | #E3E8EC | #CBD3DA | #9AA6B1 | #6B7884         | #4D5965 | #36414B | #222B33 | #121A20 |

`neutral-0` = #FFFFFF. `cream` = #FFFBF4 (warm section background).

Semantic: `success` #1E9E62 / soft #E3F5EC · `warning` #E8A317 / soft #FDF4DC · `error` #D93B3B / soft #FCE8E8 · `info` #2F80ED / soft #E6F0FD · `whatsapp` #25D366.

Added beyond Penpot (Phase 2b), all in `globals.css`:

- `*-strong` status shades (`success-strong` #157347, `warning-strong` #8A5A00, `destructive-strong` #B42318, `info-strong` #1D5FBF) for text on soft status backgrounds (AA).
- Level identity: `level-kindy` (sunny), `level-intro` (teal), `level-secondary` (orange), each with `-soft` and `-strong`.
- `whatsapp-hover` #1DA851, `overlay` (backdrop), `shadow-partner` (orange pop shadow).
- Layer tokens: `--z-sticky` 30, `--z-header` 40, `--z-overlay` 50, `--z-toast` 60 (use `z-(--z-overlay)`).

**Roles**

| Role                                 | Token                                                   |
| ------------------------------------ | ------------------------------------------------------- |
| Primary action, nav, headings accent | `teal-500` (hover `teal-600`, pressed `teal-700`)       |
| Partnership CTA, highlights          | `orange-500` (hover `orange-600`, pressed `orange-700`) |
| Badges, illustrations, decoration    | `sunny-*`                                               |
| Body text / muted text               | `neutral-800` / `neutral-600`                           |
| Borders / surfaces                   | `neutral-200` / `neutral-0`, `neutral-50`, `cream`      |
| Focus ring                           | `teal-400`, 2 px + 2 px offset                          |

**Contrast notes:**

- White text on `orange-500` and on `whatsapp` is an accepted brand decision (ADR-010), as in Penpot. Keep that text **semibold, ≥ 16 px** (button style) — never small body text on these fills.
- White on `teal-500` ≈ 5.9:1 ✅.
- `sunny-*` is never used for text on light backgrounds.

### 2.2 Typography — Poppins 400 / 500 / 600 / 700

Loaded with `next/font/google` (subset `latin`, `display: swap`, only these four weights).
Sizes are fluid (`clamp`) between mobile (360 px) and desktop (1440 px); desktop values match Penpot.

| Token      | Mobile → Desktop | Weight | Line height | Letter spacing    |
| ---------- | ---------------- | ------ | ----------- | ----------------- |
| `display`  | 36 → 56 px       | 700    | 115%        | -1 px             |
| `h1`       | 32 → 44 px       | 700    | 120%        | -0.5 px           |
| `h2`       | 28 → 36 px       | 700    | 125%        | -0.25 px          |
| `h3`       | 22 → 28 px       | 600    | 130%        | 0                 |
| `h4`       | 20 → 22 px       | 600    | 135%        | 0                 |
| `h5`       | 18 px            | 600    | 140%        | 0                 |
| `body-lg`  | 17 → 18 px       | 400    | 160%        | 0                 |
| `body`     | 16 px            | 400    | 160%        | 0                 |
| `body-sm`  | 14 px            | 400    | 155%        | 0                 |
| `caption`  | 12 px            | 400    | 150%        | 0                 |
| `label`    | 14 px            | 600    | 140%        | 0                 |
| `button`   | 16 px            | 600    | 120%        | 0.2 px            |
| `overline` | 12 px            | 600    | 140%        | 1.5 px, uppercase |

Max line length for prose: ~68ch. Blog body uses `body-lg`.

### 2.3 Spacing, layout, grid

8-pt grid (Penpot `space-1…12`): 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 120 px.
In code use Tailwind's numeric scale (1 unit = 4 px): `1` `2` `3` `4` `6` `8` `10` `12` `16` `20` `24` `30`
(e.g. Penpot `space-5` = 24 px = `p-6`). Stick to these steps; avoid odd values like `p-5` or `p-7`.

| Breakpoint | Width  | Columns | Margin | Gutter |
| ---------- | ------ | ------- | ------ | ------ |
| mobile     | < 640  | 4       | 20 px  | 16 px  |
| `sm`       | ≥ 640  | 8       | 24 px  | 16 px  |
| `md`       | ≥ 768  | 8       | 32 px  | 24 px  |
| `lg`       | ≥ 1024 | 12      | 32 px  | 24 px  |
| `xl`       | ≥ 1280 | 12      | auto   | 24 px  |

Container max width **1248 px**. Section vertical padding: 64 px mobile → 96–120 px desktop.

### 2.4 Radius & shadow

Radius: `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `2xl` 32 · `full`.
Buttons and inputs `md`; cards `xl`; badges/chips `full`; images inside cards `lg`.

| Token          | Value                            | Use                                                  |
| -------------- | -------------------------------- | ---------------------------------------------------- |
| `shadow-sm`    | `0 1px 2px rgba(10,41,48,.06)`   | inputs, subtle cards                                 |
| `shadow-md`    | `0 4px 12px rgba(10,41,48,.08)`  | cards, dropdowns                                     |
| `shadow-lg`    | `0 12px 32px rgba(10,41,48,.12)` | modals, hovered cards, sticky bars                   |
| `shadow-brand` | `0 6px 0 #124A55`                | **playful** primary CTAs only (max one per viewport) |

`shadow-brand` buttons get a "press" effect: on `:active` translate Y +4 px and shrink the shadow to 2 px.

### 2.5 Iconography

24 px grid, 2 px stroke, rounded caps — use **Lucide** (matches the Penpot set: chevron-down, search,
map-pin, phone, chat, arrow-right, check, users, book, calendar, star, menu). WhatsApp uses its official glyph (inline SVG).

---

## 3. Motion

Goal: smooth, light and meaningful. Motion explains hierarchy and feedback; it is never decoration for its own sake.

### 3.1 Tokens

| Token             | Value                                           | Use                                 |
| ----------------- | ----------------------------------------------- | ----------------------------------- |
| `duration-fast`   | 150 ms                                          | hover, press, color changes         |
| `duration-base`   | 250 ms                                          | dropdowns, tabs, accordions, toasts |
| `duration-slow`   | 400 ms                                          | modals, drawers, page transitions   |
| `duration-reveal` | 600 ms                                          | on-scroll reveals                   |
| `ease-out`        | `cubic-bezier(0.22, 1, 0.36, 1)`                | entering elements (default)         |
| `ease-in-out`     | `cubic-bezier(0.65, 0, 0.35, 1)`                | moving between states               |
| `spring-playful`  | Motion spring `{ stiffness: 400, damping: 25 }` | buttons, badges, mascot accents     |

### 3.2 Patterns (reusable components in `src/components/motion`)

| Pattern                                          | Component (file)                              | Where                                    | Behavior                                                                                                                                                                   |
| ------------------------------------------------ | --------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reveal** — fade + 24 px rise, once             | `Reveal` (`reveal.tsx`)                       | Section headers, single blocks           | `whileInView`, once, at 20% visible. Below the fold only.                                                                                                                  |
| **Stagger** — children 70 ms apart, max ~6 items | `Stagger` + `StaggerItem` (`stagger.tsx`)     | Program cards, activities, steps         | Parent reveals children in sequence; use `as="ul"` / `as="li"` for lists.                                                                                                  |
| **CountUp**                                      | `CountUp` (`count-up.tsx`)                    | Stats rows (partnership, about)          | Final number is in the HTML and the accessible name. Counts from 0 only if off screen at load; stays static if already visible or reduced motion. Locale-aware separators. |
| **Scroll progress**                              | `ScrollProgress` (`scroll-progress.tsx`)      | Blog article top bar                     | CSS `animation-timeline: scroll()`, zero JS; hidden without support or with reduced motion.                                                                                |
| **Page transition**                              | `PageTransition` (in `[locale]/template.tsx`) | Every public route                       | React `<ViewTransition>` cross-fade: old out 150 ms, new in 250 ms with 8 px settle. No-op in unsupported browsers.                                                        |
| **Subtle parallax**                              | CSS only (when needed)                        | Hero decorative shapes only              | CSS `view()` timeline, ≤ 40 px travel; never on text.                                                                                                                      |
| **Micro-interactions**                           | Built into `components/ui`                    | Buttons (press), cards (lift), accordion | CSS transitions with duration tokens; Motion only when physics is needed.                                                                                                  |
| **Skeletons**                                    | `Skeleton` (`components/ui`)                  | Cek Unit results, admin tables           | Opacity pulse, static with reduced motion.                                                                                                                                 |

JS motion values (seconds, easing arrays) come from `src/components/motion/tokens.ts`, which mirrors the CSS tokens in § 3.1.

### 3.3 Rules

- Animate **only `transform` and `opacity`** (and `clip-path` sparingly). Never animate layout properties.
- `MotionProvider` (root layout) loads `domAnimation` lazily through `LazyMotion` in **strict** mode: use `m` components
  from `motion/react-m`, never the full `motion` component (it would bundle every feature).
- Motion code lives in small client leaf components; sections stay Server Components and wrap content in `<Reveal>` / `<Stagger>`.
- **Never reveal the LCP element** (hero headline or image). Hero content renders visible immediately.
- Without JS, `[data-reveal]` elements are forced visible by a `<noscript>` style in the root layout.
- **No scroll-jacking**, no smooth-scroll libraries, no autoplaying carousels.
- `prefers-reduced-motion: reduce` → `MotionConfig reducedMotion="user"` removes movement (opacity only), CountUp and
  scroll progress stay static, view transitions are disabled, CSS transitions collapse to ~0 ms.
- Each page: at most one "hero moment"; everything else is quiet reveals.
- **Every show/hide animates both ways** (accordion, mobile menu, tabs, filters, collapsibles, toasts): 200–400 ms,
  ease-out, CSS first. For height use the grid-rows technique (`grid-rows-[0fr]` → `grid-rows-[1fr]`) on a wrapper,
  not JS measuring; pair it with a short opacity/translate on the content. Nothing should pop in or vanish abruptly.
- Keep it light: CSS transitions/keyframes before Motion, Motion before anything heavier; never animate on every scroll frame in JS.

---

## 4. Components

Primitives live in `src/components/ui` (shadcn/ui source, rewritten with our tokens — we own the code). Domain components
live in `src/features/<domain>/components`. Preview everything at **`/design-system`** (dev and staging only).

Implementation rules:

- Merge classes with `cn()` from `@/lib/utils`; it knows our custom tokens (`text-h1` + `text-primary` both survive).
- Variants with `cva`; no ad-hoc style props. Shared control/overlay looks come from `input-styles.ts` and `overlay-styles.ts`.
- **Select** for short fixed lists (≤ ~10). **Combobox** (searchable) for long lists such as regions.
- Forms use `Field`, which wires `id`, `aria-describedby`, `aria-invalid` and `aria-required` to the control:
  `<Field label="Nama">{(control) => <Input {...control} />}</Field>`.
- Built-in UI strings (close, search, no results) come from the `UI` message namespace.

| Component                    | Variants / notes                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**                   | `primary` (teal), `partner` (orange), `whatsapp` (white text), `secondary` (outline teal), `ghost`, `link`; sizes `sm` 40 / `md` 48 / `lg` 56 px, `icon`; `pop` adds the pressable brand shadow; `loading` keeps the label for screen readers; `asChild` for links. |
| **Badge**                    | Level: `Kindy` (sunny), `Intro` (teal), `Secondary` (orange). Quota: `Tersedia` (success), `Sisa N slot` (warning), `Penuh` (error), `Unit baru` (info). Always text + color, never color alone.                                                                    |
| **Cascading region select**  | Province → Regency → District → Village. Each disabled with a hint until the parent is chosen ("Pilih kabupaten dulu"). Searchable (combobox) because lists can exceed 50 items. State synced to the URL.                                                           |
| **Search**                   | "Cari nama unit, kecamatan, atau kota…" — combobox with grouped results (Units / Areas), debounced 250 ms, server-side `pg_trgm`.                                                                                                                                   |
| **Card · Program**           | Image, level badge, age range, 3 bullet skills, link. Whole card clickable (one link, stretched).                                                                                                                                                                   |
| **Card · Unit**              | Initials avatar, name, unit code, quota badge, address, manager, schedule, level badges, actions: **Chat WhatsApp** (primary) + **Lihat Rute** (Google Maps directions link).                                                                                       |
| **Section header**           | Overline + H2 + optional lead paragraph; left-aligned on mobile, centered optional on desktop.                                                                                                                                                                      |
| **Navbar**                   | Desktop: links + "Gabung Mitra" CTA. Mobile: logo + "Cek Unit" icon button + menu sheet. Becomes compact with `shadow-md` after 8 px scroll. Locale switcher ID/EN.                                                                                                 |
| **Sticky mobile action bar** | _(new)_ Bottom bar on mobile, context-aware: parents pages → "Cek Unit" + WhatsApp; partnership pages → "Cek Kuota" + "Daftar Mitra". Hidden while the on-page form is in view.                                                                                     |
| **Accordion (FAQ)**          | Radix Accordion, panels force-mounted so answers stay in the HTML for `FAQPage` schema. Opens and closes smoothly (grid-rows height + fade); hidden from AT when closed.                                                                                            |
| **Testimonial**              | Quote, name, role ("Orang tua siswa Kindy", "Mitra Kab. Bogor"), optional photo and rating. Horizontal scroll-snap list on mobile, grid on desktop (no auto carousel).                                                                                              |
| **Form field**               | Label above, helper/error text below, error announced via `aria-describedby`; inline validation on blur, not on every keystroke.                                                                                                                                    |
| **Toast**                    | Sonner, top-center on mobile, bottom-right on desktop.                                                                                                                                                                                                              |

---

## 5. Pages & user journeys (public)

### 5.1 Primary journeys

**Parent:** Landing (Google/IG/WA) → understand programs & age fit → find nearest unit → **chat unit via WhatsApp** (pre-filled message with child age & level) → placement test at unit.

**Prospective partner:** Landing (ads/Google "peluang usaha kursus") → partnership value & cost → **check village quota** → **submit application form** (stored in DB) → confirmation + notification → admin follow-up.

**Cross-over:** A parent whose area has no unit is offered "Belum ada unit di desamu — jadilah mitra pertama" with quota shown. This turns dead-end searches into partner leads.

### 5.2 Page-by-page enhancements over Penpot

| Page                          | Penpot baseline                                                                        | Enhancements                                                                                                                                                                                                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Beranda**                   | Hero, stats, 3 levels, activities, Cek Unit, 3 steps, partnership teaser, testimonials | Hero offers a **dual path** (Parent: "Cek Unit Terdekat" / Partner: "Peluang Kemitraan" text link). Stats computed from DB with CountUp. **Age picker chip** ("Usia anak: 4–6 / 7–9 / 10–15") highlights the matching level. Inline Cek Unit is a compact version that deep-links to `/cek-unit?…`. Testimonials as scroll-snap.   |
| **Program**                   | Level sections, activities, why BEC, FAQ, CTA                                          | Sticky in-page tabs (Kindy · Intro · Secondary) with scroll-spy. Each level has its own URL anchor + `Course` schema. Comparison table on desktop, stacked cards on mobile. FAQ with schema.                                                                                                                                       |
| **Cek Unit**                  | Cascading selects + unit list                                                          | **"Gunakan lokasi saya"** (Geolocation → nearest units sorted by distance, permission asked only on tap). Filters in URL (`?prov=32&kab=3201…`) — shareable and SEO-crawlable. Results show quota status. Empty state → partner cross-over CTA. Skeleton loading.                                                                  |
| **Unit / area pages** _(new)_ | —                                                                                      | Programmatic pages `/unit/[province]/[regency]` listing units with `LocalBusiness` schema and localized copy ("Kursus Bahasa Inggris Anak di Kab. Bogor"). Only regions with ≥1 active unit are indexed. Individual unit page `/unit/[...]/[unit-slug]`.                                                                           |
| **Kemitraan**                 | Hero, stats, benefits, who fits, investment, 5 steps, quota check, stories, FAQ, CTA   | Sticky secondary nav to sections; **quota checker inline** with live "Sisa N slot" badge (honest urgency, never fake). Investment block with clear inclusions; optional simple ROI estimate (inputs from admin settings). Application form at the end, also reachable from the sticky bar.                                         |
| **Daftar Mitra**              | WhatsApp-only flow                                                                     | **Short form first** (name, WhatsApp number, region via cascading select, background, motivation, consent) → stored as a lead → success screen with "Lanjut chat admin" WhatsApp button pre-filled with the lead reference. Multi-step (2 steps) on mobile; progress indicator; data kept if user goes back. Turnstile + honeypot. |
| **Blog**                      | Featured post, grid, newsletter                                                        | Category filter chips (URL-based), pagination (not infinite scroll) for SEO, reading time, newsletter block optional (admin toggle).                                                                                                                                                                                               |
| **Blog detail**               | Article, CTA                                                                           | Reading progress bar, table of contents (desktop sticky, mobile collapsible), related posts, contextual CTA (parent vs partner per post category), share buttons (WhatsApp first), `Article` + breadcrumb schema.                                                                                                                  |
| **Kontak**                    | Navbar link only                                                                       | Contact page: central WhatsApp, email, office address with map link, social links — all from settings.                                                                                                                                                                                                                             |
| **404 / error** _(new)_       | —                                                                                      | Friendly illustration + search + links to Cek Unit and Program.                                                                                                                                                                                                                                                                    |

### 5.3 WhatsApp deep links

All WhatsApp CTAs use `https://wa.me/<number>?text=<encoded template>`. Templates come from admin settings with
variables (`{unit_name}`, `{child_age}`, `{lead_ref}`, `{page_title}`) and are localized. Every click is tracked
as an analytics event (`whatsapp_click` with `context`).

---

## 6. Admin dashboard

Baseline: Penpot `02 · Dashboard` (Ringkasan, Calon Mitra, Unit Mitra, Kuota Wilayah, Artikel Blog, Tulis Artikel, Ubah Unit, Testimoni).

- **Layout:** collapsible sidebar (icons-only at `lg`, sheet on mobile), top bar with search (⌘K command palette), user menu. Content max width 1280 px.
- **Tables:** TanStack Table — server-side pagination, sorting and filters reflected in the URL; column visibility; row actions in a menu; bulk actions where useful (leads status); CSV export for leads.
- **Forms:** two-column on desktop, single column on mobile; sticky footer with Save/Cancel; unsaved-changes guard; optimistic toasts; destructive actions behind a confirm dialog that names the item.
- **Localized fields:** tabs `ID | EN` inside the form, with a dot indicator for missing EN translation.
- **SEO panel:** collapsible section on every content form — title/description with character counters, Google result preview, OG image, (super admin only) `noindex`.
- **Empty, loading and error states** are designed for every list.
- **Dashboard home (Ringkasan):** KPI cards (new leads this week, active units, quota fill rate, posts published), leads trend chart, latest leads, storage usage of the DB.
- **Lead pipeline:** statuses `baru → dihubungi → survei → disetujui / ditolak`, with notes and activity history.
- Admin motion is minimal: 150–250 ms transitions only, no reveals.

---

## 7. Responsive & accessibility checklist

- Test at **360, 390, 768, 1024, 1440 px**. No horizontal scroll at 320 px.
- Touch targets ≥ 44×44 px; spacing between adjacent targets ≥ 8 px.
- Images: `next/image` with `sizes`, AVIF/WebP, explicit dimensions or aspect-ratio (CLS); hero image `priority`.
- Forms: correct `inputmode` / `autocomplete` (`tel`, `name`, `email`), phone normalized to `62…`.
- Keyboard: visible focus ring, skip-to-content link, focus trapped in dialogs and returned on close.
- Language: `<html lang>` matches locale; content in the other language marked with `lang`.
- Color is never the only signal (quota badges carry text).

---

## 8. Imagery & illustration

- Real photos of children learning at units (with consent) beat stock photos; warm, bright, natural light.
- Decorative shapes: rounded blobs and dots in `sunny`/`orange`/`teal` 100–300 tints, placed behind content.
- Every image needs meaningful `alt` text in both languages (admin field), or `alt=""` if decorative.
- OG images generated per page with `next/og` using brand colors, Poppins and the page title.
