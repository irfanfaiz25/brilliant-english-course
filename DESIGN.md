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
- **One continuous background.** Never let a gradient or blob stop at a section boundary: use `PageCanvas` + transparent
  sections, `overflow-x-clip` (never `overflow-hidden`) on sections, and masked fades for surface changes. Hard edges
  are only allowed for the dark footer.
- **Never flat — layered depth.** Every page section sits on a surface with some dimension, using tokens only:
  - Backgrounds: `bg-gradient-soft` (teal haze), `bg-gradient-warm` (cream + sunny/teal glows), `bg-gradient-teal-deep`
    (dark bands, footer), optional `bg-dots` texture masked to fade out.
  - `DecorBlob` (blurred color fields, `components/site/decor-blob.tsx`) behind hero and section corners — 1–2 per section.
  - Cards rest on `shadow-card` (contact + ambient shadow), lift to `shadow-lg` on hover; key CTAs and highlighted cards may
    use tinted `shadow-glow-primary` / `shadow-glow-partner`.
  - Sticky bars use `surface-glass` (frosted, translucent) instead of solid white.
  - Accent headings or numbers may use `text-gradient-brand` — sparingly, once per section at most.
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
- `partner-strong` (`orange-700`) for small partner text on `partner-soft` surfaces (AA).
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

Pick icons that say what the item is (map pin for location, layers for levels, users for class size). Avoid the
generic "sparkles"/AI-style icon; it reads as filler.

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

| Pattern                                          | Component (file)                              | Where                                    | Behavior                                                                                                                                                                                                             |
| ------------------------------------------------ | --------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reveal** — fade + 24 px rise, once             | `Reveal` (`reveal.tsx`)                       | Section headers, single blocks           | `whileInView`, once, at 20% visible. Below the fold; pass `immediate` (also on `Stagger`) for blocks that can be in the first viewport.                                                                              |
| **Stagger** — children 70 ms apart, max ~6 items | `Stagger` + `StaggerItem` (`stagger.tsx`)     | Program cards, activities, steps         | Parent reveals children in sequence; use `as="ul"` / `as="li"` for lists.                                                                                                                                            |
| **CountUp**                                      | `CountUp` (`count-up.tsx`)                    | Stats rows (partnership, about)          | Final number is in the HTML and a screen-reader-only copy (animated digits are `aria-hidden`). Counts from 0 only if off screen at load; stays static if already visible or reduced motion. Locale-aware separators. |
| **Scroll progress**                              | `ScrollProgress` (`scroll-progress.tsx`)      | Blog article top bar                     | CSS `animation-timeline: scroll()`, zero JS; hidden without support or with reduced motion.                                                                                                                          |
| **Page transition**                              | `PageTransition` (in `[locale]/template.tsx`) | Every public route                       | React `<ViewTransition>` cross-fade: old out 150 ms, new in 250 ms with 8 px settle. No-op in unsupported browsers.                                                                                                  |
| **Subtle parallax**                              | CSS only (when needed)                        | Hero decorative shapes only              | CSS `view()` timeline, ≤ 40 px travel; never on text.                                                                                                                                                                |
| **Micro-interactions**                           | Built into `components/ui`                    | Buttons (press), cards (lift), accordion | CSS transitions with duration tokens; Motion only when physics is needed.                                                                                                                                            |
| **Skeletons**                                    | `Skeleton` (`components/ui`)                  | Cek Unit results, admin tables           | Opacity pulse, static with reduced motion.                                                                                                                                                                           |

JS motion values (seconds, easing arrays) come from `src/components/motion/tokens.ts`, which mirrors the CSS tokens in § 3.1.

### 3.3 Rules

- Animate **only `transform` and `opacity`** (and `clip-path` sparingly). Never animate layout properties.
- `MotionProvider` (root layout) loads `domAnimation` lazily through `LazyMotion` in **strict** mode: use `m` components
  from `motion/react-m`, never the full `motion` component (it would bundle every feature).
- Motion code lives in small client leaf components; sections stay Server Components and wrap content in `<Reveal>` / `<Stagger>`.
- **Never reveal the LCP element** (hero headline or image). Hero content renders visible immediately.
- **Nothing in the first viewport starts at opacity 0** (ADR-022): text painted invisible only counts for LCP after
  hydration. Large hero text uses `animate-lift-in` (translate only); small hero items may use `animate-rise-in`;
  `Reveal` / `Stagger` blocks right under the hero get `immediate`.
- Without JS, `[data-reveal]` elements are forced visible by a `<noscript>` style in the root layout.
- **No scroll-jacking**, no smooth-scroll libraries, no autoplaying carousels.
- `prefers-reduced-motion: reduce` → `MotionConfig reducedMotion="user"` removes movement (opacity only), CountUp and
  scroll progress stay static, view transitions are disabled, CSS transitions collapse to ~0 ms.
- Each page: at most one "hero moment"; everything else is quiet reveals.
- **Smooth scrolling** for in-page jumps (anchors, age chips, skip link): `scroll-behavior: smooth` on `<html>` with
  `scroll-padding-top: var(--header-offset)` so targets land below the sticky header. Route changes stay instant
  (`data-scroll-behavior="smooth"` lets Next.js disable it during navigation); reduced motion turns it off.
- **Every show/hide animates both ways** (accordion, mobile menu, tabs, filters, collapsibles, toasts): 200–400 ms,
  ease-out, CSS first. For height use the grid-rows technique (`grid-rows-[0fr]` → `grid-rows-[1fr]`) on a wrapper,
  not JS measuring; pair it with a short opacity/translate on the content. Nothing should pop in or vanish abruptly.
- Keep it light: CSS transitions/keyframes before Motion, Motion before anything heavier; never animate on every scroll frame in JS.
- Admin drag-to-reorder uses Motion's `Reorder` from `motion/react-m` inside its own lazy `LazyMotion` (`domMax`),
  never a separate drag-and-drop library (§ 6 Reordering).

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

| Component                    | Variants / notes                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Button · inverse**         | Outline button for dark panels (`variant="inverse"`, white/30 border); with `pop` uses `shadow-inverse-pop`.                                                                                                                                                                                                                                                       |
| **Button pairs**             | Buttons shown side by side share one model: same size and, if one uses `pop`, the other does too (`secondary` + `pop` = outline with `shadow-soft-pop`). Colors may differ.                                                                                                                                                                                        |
| **Button**                   | `primary` (teal), `partner` (orange), `whatsapp` (white text), `secondary` (outline teal), `ghost`, `link`; sizes `sm` 40 / `md` 48 / `lg` 56 px, `icon`; `pop` adds the pressable brand shadow; `loading` keeps the label for screen readers; `asChild` for links.                                                                                                |
| **Badge**                    | Level: `Kindy` (sunny), `Intro` (teal), `Secondary` (orange). Quota: `Tersedia` (success), `Sisa N slot` (warning), `Penuh` (error), `Unit baru` (info). Always text + color, never color alone.                                                                                                                                                                   |
| **Cascading region select**  | Province → Regency → District → Village. Each disabled with a hint until the parent is chosen ("Pilih kabupaten dulu"). Searchable (combobox) because lists can exceed 50 items. State synced to the URL.                                                                                                                                                          |
| **Search**                   | "Cari nama unit, kecamatan, atau kota…" — combobox with grouped results (Units / Areas), debounced 250 ms, server-side `pg_trgm`.                                                                                                                                                                                                                                  |
| **Card · Program**           | Image, level badge, age range, 3 bullet skills, link. Whole card clickable (one link, stretched).                                                                                                                                                                                                                                                                  |
| **Card · Unit**              | Initials avatar, name, unit code, quota badge, address, manager, schedule, level badges, actions: **Chat WhatsApp** (primary) + **Lihat Rute** (Google Maps directions link).                                                                                                                                                                                      |
| **Section header**           | Overline + H2 + optional lead paragraph; left-aligned on mobile, centered optional on desktop.                                                                                                                                                                                                                                                                     |
| **Site shell**               | `SiteShell` (`components/site`) wraps every public page: skip link → header → `<main id="main">` → footer → mobile action bar. The localized 404 uses it too.                                                                                                                                                                                                      |
| **Navbar**                   | Sticky; transparent at the top, `surface-glass` + `shadow-md` once scrolled (IntersectionObserver sentinel, no scroll listeners). Desktop (`lg`+): logo, nav with growing underline for the current section, ID/EN switch, "Gabung Mitra". Below `lg`: logo, "Cek Unit" icon button, menu sheet (nav, CTAs, WhatsApp, language). Anchored during page transitions. |
| **Sticky mobile action bar** | Floating frosted bar below `lg`: parents → "Cek Unit" + WhatsApp; partnership pages (`partnerPaths`) → "Cek Kuota" + "Daftar Mitra". Slides in on load. Footer reserves space for it.                                                                                                                                                                              |
| **Accordion (FAQ)**          | Radix Accordion, panels force-mounted so answers stay in the HTML for `FAQPage` schema. Opens and closes smoothly (grid-rows height + fade); hidden from AT when closed.                                                                                                                                                                                           |
| **Testimonial**              | Quote, name, role ("Orang tua siswa Kindy", "Mitra Kab. Bogor"), optional photo and rating. Horizontal scroll-snap list on mobile, grid on desktop (no auto carousel).                                                                                                                                                                                             |
| **Form field**               | Label above, helper/error text below, error announced via `aria-describedby`; inline validation on blur, not on every keystroke.                                                                                                                                                                                                                                   |
| **Footer**                   | Dark `bg-gradient-teal-deep` band with decor blobs: logo chip, tagline, social icons (simple-icons), Program / Explore link groups, WhatsApp + email + address, copyright and ID/EN switch. Uses `inverse-*` tokens.                                                                                                                                               |
| **Locale switch**            | Segmented ID / EN pill (`tone="light"` or `"dark"`); plain links to the same page in each language.                                                                                                                                                                                                                                                                |
| **Toast**                    | Sonner, top-center on mobile, bottom-right on desktop.                                                                                                                                                                                                                                                                                                             |

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

### 5.3 Implementation notes (Beranda, 5a-1)

- **Hero motion:** copy, CTAs, chips and badges rise in on load with CSS (`animate-rise-in`, 90 ms steps); the
  headline is static and the photo only settles from a slight zoom (`animate-settle`, transform only) so LCP is not delayed.
  Badges then drift (`animate-float`). Decorative layers use `parallax-soft` / `parallax-strong` (CSS scroll-driven).
- **Doodles** (`components/site/doodle.tsx`: ring, squiggle, plus, dots, blob) add playful depth — 2–4 per section,
  away from text, some with parallax or float.
- **Continuous canvas:** pages wrap their sections in `PageCanvas`; sections are transparent (`Section` tone `canvas`)
  and clip only horizontally (`overflow-x-clip`), so blobs and gradients flow across section edges. A section that
  needs its own color fades it in with a mask (e.g. Activities' warm wash) instead of starting at a hard line.

- **Hero:** headline and photo render immediately (LCP, never animated in). Floating glass badges drift slowly (`animate-float`, off for reduced motion). "Fun" is highlighted with a hand-drawn underline.
- **Age chips** are plain `#level-<slug>` anchors: the browser scrolls to the level card and CSS `:target` rings it in the level color. No JavaScript.
- **Hero overline** is two short segments (label + age chip) on one line — never let a pill wrap on phones.
- **Stats** sit on a card that overlaps the hero's bottom edge; numbers come from `getNetworkStats()` and count up
  (`CountUp hiddenOnLoad`, safe because the card is inside a `Reveal`). Labels break into two balanced lines on phones
  (`<br>` in the message, hidden from `md`) so columns stay aligned.
- **Level cards:** photo, level color bar, age chip, skills with level-colored checks; whole card is one link to `/program#<slug>`.
- **Activities:** photo-led cards with text on a dark gradient; CSS scroll-snap row on phones, grid from `md`.

**Beranda, 5a-2:**

- **Unit finder teaser:** a plain GET `<form role="search">` to the localized Cek Unit URL (`?q=`), so it works without JS;
  "Use my location" links to `?dekat=1`. Preview of active units uses the shared `UnitCard` (`features/units/components`).
- **Unit card:** initials avatar, enrollment badge (text + color), address / manager / schedule (`formatUnitSchedule`,
  localized weekdays and time notation), level badges, WhatsApp (pre-filled with the unit name) + Google Maps directions.
- **Steps (interactive):** a vertical tab list (`steps-showcase.tsx`) beside a live preview of each step (search result,
  WhatsApp chat, placement result) built from tokens (`steps-previews.tsx`). The active step expands its text (grid-rows),
  per-step connectors (centered on the markers) fill as steps are reached, and previews cross-fade (`AnimatePresence`)
  while their parts rise/grow in with CSS. Auto-play time per step comes from the amount of text (`stepDurationMs`:
  3.5 s + 250 ms/word, clamped 6–10 s, ≈ 7 s now) with a progress bar; pauses on hover/focus, stops after a manual
  choice, never with reduced motion. Keyboard: arrows, Home, End.
- **Partnership teaser:** a dark rounded **panel** floating on the canvas (never a full-width band), `inverse` + `pop`
  outline button paired with the partner CTA, quota note, count-up of joined units.
- **Testimonials:** quote cards with rating (`aria-label`), CSS scroll-snap row on phones, grid from `lg`.
- **FAQ:** sticky intro + "ask on WhatsApp" card beside the accordion; `FAQPage` JSON-LD via `src/lib/seo/json-ld.tsx`.
- **Closing CTA:** warm panel with the two parent actions (find a unit / WhatsApp), both `pop`.

**Program, 5b:**

- **Header:** breadcrumb (`Breadcrumbs`, with `BreadcrumbList` JSON-LD), overline, title, lead, two fact chips.
- **Sticky level tabs** (shared `SectionTabs`, `components/site/section-tabs.tsx`): plain `#kindy`/`#intro`/`#secondary` anchors under the header, glass bar;
  a pill slides to the current tab (measured offsets) and the bar scrolls horizontally on phones. Scroll-spy with
  IntersectionObserver: the current level is the last one whose top passed the top 40% of the viewport. Level sections
  add `scroll-mt-16` so anchors land below header + tabs.
- **Level detail** (one per level, photo side alternates): level-colored blob, frame, badge and checks; curriculum as
  small cards (stagger); fact chips (classes/week, class size, modules); "find a unit" + level-specific WhatsApp
  (`pop` pair); `Course` JSON-LD per level.
- **Activities** reuse the shared section with `id="kegiatan"` (target of "see program details") and no card links.
- **Why BEC:** four benefit cards with tinted icons that tilt on hover.
- **Comparison:** a real `<table>` (caption, row/column headers) from `md`, stacked definition-list cards on phones —
  both generated from the same level data.
- **FAQ** (`topic: "program"`) and **closing CTA** use the shared `FaqSection` / `ClosingCtaSection`.

**Cek Unit, 5c:**

- **URL is the state:** `?q=` text, `?wilayah=` deepest selected region code, `?lat=&lng=` (rounded to ~100 m),
  `?dekat=1` (came from "use my location"). Every result is shareable ("copy results link") and works without JS
  (GET forms; native selects; `noscript` Apply button).
- **Layout:** desktop — sticky side panel (search, location, region cascade) beside the results; phones — a compact panel
  (search, location, "Filter wilayah" bottom sheet with an active-count badge), results first.
- **Smooth, no flashing:** filters call `router.replace` inside a transition; current results stay and dim
  (`PendingRegion`) until the new ones arrive; new cards rise in with a short CSS stagger. First load streams behind
  a shape-matched skeleton (Cache Components + `Suspense`).
- **Search** is live (450 ms debounce), accent/case-insensitive, all words must match.
- **Location** is requested only on tap (never on load); `?dekat=1` highlights the button instead. Denied/unavailable →
  toast with a manual fallback. Results then sort by distance and each card shows "x,y km".
- **Active filters** are removable chips (plain links) + "clear all"; result count is an `aria-live` heading.
- **Empty area → partnership:** "Belum ada unit BEC di {area}" with "Jadi mitra pertama di sini"
  (`/kemitraan?wilayah=…#daftar`), "search the wider area" and WhatsApp; empty text search suggests other words.
- **Structured data:** results as an `ItemList` of `LocalBusiness`. The mobile action bar drops its "Cek Unit" button here.

**Kemitraan, 5d:**

- **Order follows the partner's questions:** promise (hero) → what BEC provides (6 benefits) → "is this for me?"
  (profiles + what to prepare, beside the package card) → the 5 steps → **quota check + form** → partner stories →
  FAQ → closing CTA. Sticky `SectionTabs` jump between sections (scroll-spy as on Program).
- **Hero:** partner-colored CTA pair "Cek Kuota Desamu" (`#kuota`) + "Daftar Jadi Mitra" (`#daftar`), stats card with
  CountUp (joined units, cities) and the quota rule "Maks. 2 unit per desa". Photo + floating badge from `lg` only.
- **Package card:** inclusions on a dark teal panel; the investment shows only when admins publish it, otherwise
  "explained during the consultation" + WhatsApp. Sticky beside the profiles on desktop.
- **Quota checker (`#kuota`):** the shared region cascade with `?wilayah=` in the URL (same `UrlStateShell` as Cek Unit),
  so "Jadi mitra pertama di sini" arrives pre-filled. Result card: status badge with text (Tersedia / Sisa N slot /
  Penuh), a slot meter, active units and partners joining, and the next step (apply, or see existing units when full).
  Honest urgency only: numbers come from data.
- **Form (`#daftar`):** two steps with a progress bar — contact (name, WhatsApp, optional email), then background (radio
  cards), room (segmented), optional plan (counter) and consent. The village comes from the checker and is summarised at
  the top ("Ganti" jumps back); typed answers survive a village change. Errors appear on Lanjut/submit and clear while
  typing — never on blur, so buttons don't shift under the pointer. Enter on step 1 advances. Focus moves to each new
  step and to the success heading.
- **Success:** application number (`MTR-YYMMDD-XXXX`) + "continue on WhatsApp" with a pre-filled message quoting it.
- **Mobile:** checker and form stack (checker first); the action bar shows "Cek Kuota" + "Daftar Mitra".

**Blog, 5e:**

- **Index:** header, then category chips (one sideways-scrolling row on phones) with the article count, the newest
  post as a wide featured card (unfiltered page 1 only), a 1/2/3-column card grid and numbered pagination. State lives
  in the URL (`?kategori=`, `?halaman=`); chips and pages are plain links, so filters are shareable and crawlable.
  Empty categories show a friendly empty state. The listing streams in behind a shape-matched skeleton.
- **Card:** cover with category badge (color per category, always with text), date + reading time, title (the only
  link, stretched over the card), excerpt and "read article"; lifts on hover, cover zooms gently.
- **Post:** reading progress bar, breadcrumb (long titles truncate), category, title, lead, author + meta, a wide cover,
  then the article (max ~68 characters per line) beside a sticky sidebar with the table of contents and share links on
  desktop. On phones the table of contents is a collapsible panel above the text and sharing sits under it.
- **After reading:** a next-step card (partnership posts → quota check; others → Cek Unit + WhatsApp) and three related
  posts (same category first). Sharing: WhatsApp share link (no JS) + copy link.
- **Content** is the editor's rich-text JSON rendered on the server (paragraphs, H2/H3, lists, quotes, bold/italic,
  links); heading anchors are generated once and shared with the table of contents.

**Kontak, 5f:**

- **Route first, then contact:** three cards — parents (schedules and fees belong to the unit → Cek Unit, or ask the
  head office on WhatsApp), prospective partners (→ Kemitraan, or chat the partnership team) and media/collaboration
  (→ email, or the message form). Saves the head office from questions only a unit can answer.
- **Message composer (`#pesan`):** topic (segmented), name and message, validated like the partner form, then the
  tidy text ("Halo BEC, saya {name} ({topic}) …") opens in WhatsApp in a new tab, with a fallback link if it was
  blocked. Nothing is stored on our side; a note says so.
- **Details panel:** dark teal card with WhatsApp, email, address + directions, office hours and socials, all from
  contact settings (sticky beside the form on desktop, below it on phones). The hero shows the reply window.
- **Structured data:** `EducationalOrganization` with a customer-service `ContactPoint` and opening hours.

**Unit & area pages, 5c-2:**

- **URLs:** `/unit` (directory) → `/unit/{provinsi}` → `/unit/{provinsi}/{kabupaten}` → `/unit/{provinsi}/{kabupaten}/{unit}`
  (English `/en/units/…`, same slugs). Only areas with at least one active unit get a page.
- **Area page:** "Kursus Bahasa Inggris Anak di {area}" with fact chips (units, regencies or districts, levels),
  regency links on province pages, the unit cards, a "sort by my location" shortcut into Cek Unit and the partner
  banner pre-filled with the area (`/kemitraan?wilayah=…#kuota`).
- **Unit page:** breadcrumb through province and regency, enrollment badge, an info card (address + map pin, schedule,
  manager, enrollment note, WhatsApp + directions as a `pop` pair), the classes it offers (links into Program), the shared
  activities section and the three nearest other units with distances.
- **Linking:** unit names on every card (Cek Unit, Beranda, area pages) link to the unit page; the footer links to the
  directory. Shared `PageHero` and `PartnerBanner` keep these pages identical in rhythm to Cek Unit and Blog.

### 5.4 WhatsApp deep links

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
- **Glass, lightly (Phase 3c):** the shell sits on `bg-gradient-soft` with three fixed `DecorBlob`s; sidebar, top bar
  and content cards use `surface-glass-panel` (72 % white, 16 px blur, hairline white border, `shadow-card`). Text
  never sits on raw blur: panels stay opaque enough for AA contrast without `backdrop-filter`. Active nav items are a
  solid white pill with the primary icon; module placeholders carry a "Segera" badge until their phase ships.
- **Settings-style forms (Phase 4a):** one `AdminPanel` per independently saved form, the form's own footer with
  Save (enabled once something changed), Discard and an "unsaved changes" note; a "last changed … by …" line under
  the panel description. Short localized fields (SEO texts, partnership inclusions) show **both locales stacked**
  (fieldset per locale) instead of tabs, so admins compare ID and EN at a glance; long content (blog, programs) keeps
  the `ID | EN` tabs. Per-item editors on a list open in a right sheet (full width on phones). The SEO editor shows
  the default text as placeholder, character counters and a live search-result preview.
- **Content forms (Phase 4b):** an edit page per record with a back link, `AdminPanel`s for structured fields
  (numbers, photo, visibility) above the localized copy in `LocaleTabs` (`ID | EN`; a red dot marks a tab with
  errors, and a failed save opens the first invalid tab and focuses its field). Lists of short texts use
  `StringListField`; images come from `MediaPicker` (library grid, uploads arrive in 4e). Once the form is dirty the
  save bar sticks to the bottom of the viewport, and `UnsavedChangesGuard` asks before leaving (browser prompt for
  reload/close, a dialog for in-app links). Lists use row controls: a visibility switch with a visible state label,
  drag-to-reorder (below), and delete behind a confirm dialog that names the item; every control's accessible name
  names its item ("Hapus Book Day").
- **Live card preview (Phase 4b):** content forms whose record appears as a card on the site show that card beside the
  copy (`CardPreview` + the site's own card component, so the preview can never drift from the real card). It follows
  the open language tab and updates while typing; empty fields show their field label. From `xl` it is a sticky side
  column; below that a collapsed "Pratinjau di situs" panel above the copy. The card is `inert` (not clickable or
  focusable) and labels come from the public messages of that locale.
- **Lists and region data (Phase 4c):** data lists are a semantic table from `md` and stacked cards below (no sideways
  scrolling on phones), with a plain GET search form, status chips that show counts and keep the search, and
  previous/next paging. Regions are picked with `RegionPicker`: four native selects (the OS picker is best for long
  lists on phones), each level loading the next. Components that sit in panels of varying width (the form footer,
  the unit card's buttons) lay out by container queries, not by viewport breakpoints.
- **Reordering (Phase 4f):** every manually ordered list (Kegiatan, Testimoni, FAQ, and the `StringListField` lists
  of content forms) is reordered by dragging a row's grip (⠿, left of the row, `Sortable` on Motion's `Reorder`). Only
  the grip starts a drag, so phones still scroll the page and the row's own controls keep working. The held row lifts
  (white surface, `shadow-lg`), the others slide aside in 250 ms with ease-out (instant with reduced motion), and the
  page scrolls near its edges. Keyboard: Tab to the row, Space to pick it up, arrows to move, Space to drop, Escape
  to put it back; a hidden instruction and a live region say what happens ("Book Day di posisi 2 dari 4"). Lists save
  on drop with a short "Urutan disimpan." toast (forms save with the form); a save refused because the list changed
  elsewhere reloads the list. The drag engine (`domMax`) loads lazily, after the list is on screen. Roles without
  `update` see the same rows without grips. A hint above the list says that its order is the site's order.
- **Breadcrumbs:** every admin page except Ringkasan starts with a trail above its title: Ringkasan › parent
  pages › the page itself (bold, not a link, cut with an ellipsis when long). Phones show only "‹ parent" in the
  primary color, which replaces the old "← Semua …" back links; the full trail starts at `sm`. Parents are named
  by their sidebar module, so labels and URLs come from `admin-navigation.ts`.
- **Media (Phase 4e):** the library is a card grid (2 → 3 → 4 columns) beside a sticky upload panel from `xl`
  (above it below `xl`). Uploading never blocks: files queue (two at a time) in a list that shows each thumbnail,
  real byte progress ("2,4 MB dari 4,4 MB", percent), then "Memproses gambar…" and the final size; a file can be
  cancelled, and failures say what to do (another file for a wrong type or size, "ulangi" for a dropped
  connection). Phones get the button and the rules only (no drop text). Cards show usage ("Dipakai 2×" /
  "Belum dipakai") so cleanup is easy; an image in use has no delete button and its page lists where it is used.
  The image picker reuses the same uploader, and a finished upload is picked right away.
- **Record pages (Phase 4d):** a record that is worked over time (a lead) opens on its own page: the record's data
  and its history in the main column, the controls that change it (status, assignee) and related context (quota,
  linked unit) in a sticky side column from `xl`, stacked below the data on smaller screens. The history is one
  timeline, newest first: notes as quotes, recorded changes as short lines ("Status: Baru → Persiapan"), each with
  time and author ("Sistem" when nobody signed in). List pages share `listHref()` (URL state without defaults) and
  `ListPagination`. A select whose options can share a label (staff with the same name) adds what tells them apart.

---

## 7. Responsive & accessibility checklist

- Test at **360, 390, 768, 1024, 1440 px**. No horizontal scroll at 320 px.
- Touch targets ≥ 44×44 px; spacing between adjacent targets ≥ 8 px.
- Images: `next/image` with `sizes`, AVIF/WebP, explicit dimensions or aspect-ratio (CLS); hero image `priority`.
- Forms: correct `inputmode` / `autocomplete` (`tel`, `name`, `email`), phone normalized to `62…`.
- Keyboard: visible focus ring, skip-to-content link, focus trapped in dialogs and returned on close. Stretched card
  links draw the ring on their `::after` overlay. `tests/e2e/accessibility.spec.ts` tabs through every page template.
- Accessible names start with the visible text (WCAG 2.5.3); add context with an `sr-only` span, not `aria-label`.
  Never put `aria-label` on a plain `span`/`p`.
- Description lists: each row is a `div` holding only `dt` + `dd` (`FactRow` in `components/site`).
- Language: `<html lang>` matches locale; content in the other language marked with `lang`.
- Color is never the only signal (quota badges carry text).

---

## 8. Imagery & illustration

- Real photos of children learning at units (with consent) beat stock photos; warm, bright, natural light.
- Decorative shapes: rounded blobs and dots in `sunny`/`orange`/`teal` 100–300 tints, placed behind content.
- Every image needs meaningful `alt` text in both languages (admin field), or `alt=""` if decorative.
- OG images generated per page with `next/og` using brand colors, Poppins and the page title.
