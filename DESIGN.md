# DESIGN.md — BEC Design System & UX Guidelines

Source: Penpot file **BEC** → `00 · Design System` (v1.0), `01 · Website`, `02 · Dashboard`.
The Penpot design is the **brand baseline and layout direction, not a strict spec**. This document
keeps the brand (tokens below are binding) and records where we deliberately improve UX, motion
and responsiveness. When this file and Penpot disagree, this file wins; update it when a decision changes.

---

## 1. Brand & principles

Palette comes from the BEC logo: **Teal (B)**, **Orange (E)**, **Sunny (C)**. Single typeface: **Poppins**.

Personality: *playful but trustworthy* — fun for kids, credible for parents and investors.

1. **Clarity first.** Every page has one primary action. Parents → find a unit / chat. Partners → check quota / apply.
2. **Playful, not noisy.** Rounded shapes, warm accents, the "pressable" brand shadow — used sparingly.
3. **Mobile is the main device.** Most visitors arrive from WhatsApp, Instagram and Google on phones. Design at 360 px first.
4. **Fast is a feature.** Motion and imagery never cost Core Web Vitals.
5. **Accessible by default.** WCAG 2.2 AA is the floor, not a stretch goal.

---

## 2. Tokens

Implemented as Tailwind v4 `@theme` variables in `src/styles/globals.css`. Use tokens, never raw hex in components.

### 2.1 Color

| Scale | 50 | 100 | 200 | 300 | 400 | **500 (brand)** | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| `teal` (primary) | #E8F4F6 | #C7E3E8 | #93C7D0 | #5EA9B6 | #33899A | **#1B6E7E** | #165B69 | #124A55 | #0E3942 | #0A2930 |
| `orange` (secondary) | #FFF2E8 | #FFDDC4 | #FDBA8C | #F8964F | #EE7A26 | **#DD6510** | #B8520B | #924109 | #6E3107 | #4A2105 |
| `sunny` (accent) | #FFF8E9 | #FFEDC7 | #FFDB8F | #FDC659 | #F9B23A | **#F5A02A** | #D9861A | #B06A12 | #84500E | #5A3609 |
| `neutral` | #F8FAFB | #F1F4F6 | #E3E8EC | #CBD3DA | #9AA6B1 | #6B7884 | #4D5965 | #36414B | #222B33 | #121A20 |

`neutral-0` = #FFFFFF. `cream` = #FFFBF4 (warm section background).

Semantic: `success` #1E9E62 / soft #E3F5EC · `warning` #E8A317 / soft #FDF4DC · `error` #D93B3B / soft #FCE8E8 · `info` #2F80ED / soft #E6F0FD · `whatsapp` #25D366.

**Roles**
| Role | Token |
|---|---|
| Primary action, nav, headings accent | `teal-500` (hover `teal-600`, pressed `teal-700`) |
| Partnership CTA, highlights | `orange-600` background (see contrast note), `orange-500` for decoration |
| Badges, illustrations, decoration | `sunny-*` |
| Body text / muted text | `neutral-800` / `neutral-600` |
| Borders / surfaces | `neutral-200` / `neutral-0`, `neutral-50`, `cream` |
| Focus ring | `teal-400`, 2 px + 2 px offset |

**Contrast rules (enhancement over Penpot):**
- White text on `orange-500` is ~3.5:1 → fails AA for button text. **Use `orange-600` (#B8520B, ~4.9:1) for filled orange buttons**, keep `orange-500` for large display text, icons and decoration.
- White on `teal-500` ≈ 5.9:1 ✅.
- White text on `whatsapp` #25D366 fails. WhatsApp buttons use `neutral-900` text on `whatsapp`, or a white button with the WhatsApp icon in green.
- `sunny-*` is never used for text on light backgrounds.

### 2.2 Typography — Poppins 400 / 500 / 600 / 700

Loaded with `next/font/google` (subset `latin`, `display: swap`, only these four weights).
Sizes are fluid (`clamp`) between mobile (360 px) and desktop (1440 px); desktop values match Penpot.

| Token | Mobile → Desktop | Weight | Line height | Letter spacing |
|---|---|---|---|---|
| `display` | 36 → 56 px | 700 | 115% | -1 px |
| `h1` | 32 → 44 px | 700 | 120% | -0.5 px |
| `h2` | 28 → 36 px | 700 | 125% | -0.25 px |
| `h3` | 22 → 28 px | 600 | 130% | 0 |
| `h4` | 20 → 22 px | 600 | 135% | 0 |
| `h5` | 18 px | 600 | 140% | 0 |
| `body-lg` | 17 → 18 px | 400 | 160% | 0 |
| `body` | 16 px | 400 | 160% | 0 |
| `body-sm` | 14 px | 400 | 155% | 0 |
| `caption` | 12 px | 400 | 150% | 0 |
| `label` | 14 px | 600 | 140% | 0 |
| `button` | 16 px | 600 | 120% | 0.2 px |
| `overline` | 12 px | 600 | 140% | 1.5 px, uppercase |

Max line length for prose: ~68ch. Blog body uses `body-lg`.

### 2.3 Spacing, layout, grid

8-pt grid: `1`=4 · `2`=8 · `3`=12 · `4`=16 · `5`=24 · `6`=32 · `7`=40 · `8`=48 · `9`=64 · `10`=80 · `11`=96 · `12`=120 px.

| Breakpoint | Width | Columns | Margin | Gutter |
|---|---|---|---|---|
| mobile | < 640 | 4 | 20 px | 16 px |
| `sm` | ≥ 640 | 8 | 24 px | 16 px |
| `md` | ≥ 768 | 8 | 32 px | 24 px |
| `lg` | ≥ 1024 | 12 | 32 px | 24 px |
| `xl` | ≥ 1280 | 12 | auto | 24 px |

Container max width **1248 px**. Section vertical padding: 64 px mobile → 96–120 px desktop.

### 2.4 Radius & shadow

Radius: `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `2xl` 32 · `full`.
Buttons and inputs `md`; cards `xl`; badges/chips `full`; images inside cards `lg`.

| Token | Value | Use |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(10,41,48,.06)` | inputs, subtle cards |
| `shadow-md` | `0 4px 12px rgba(10,41,48,.08)` | cards, dropdowns |
| `shadow-lg` | `0 12px 32px rgba(10,41,48,.12)` | modals, hovered cards, sticky bars |
| `shadow-brand` | `0 6px 0 #124A55` | **playful** primary CTAs only (max one per viewport) |

`shadow-brand` buttons get a "press" effect: on `:active` translate Y +4 px and shrink the shadow to 2 px.

### 2.5 Iconography
24 px grid, 2 px stroke, rounded caps — use **Lucide** (matches the Penpot set: chevron-down, search,
map-pin, phone, chat, arrow-right, check, users, book, calendar, star, menu). WhatsApp uses its official glyph (inline SVG).

---

## 3. Motion

Goal: smooth, light and meaningful. Motion explains hierarchy and feedback; it is never decoration for its own sake.

### 3.1 Tokens
| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150 ms | hover, press, color changes |
| `duration-base` | 250 ms | dropdowns, tabs, accordions, toasts |
| `duration-slow` | 400 ms | modals, drawers, page transitions |
| `duration-reveal` | 600 ms | on-scroll reveals |
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | entering elements (default) |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | moving between states |
| `spring-playful` | Motion spring `{ stiffness: 400, damping: 25 }` | buttons, badges, mascot accents |

### 3.2 Patterns (reusable components in `src/components/motion`)
| Pattern | Where | Implementation |
|---|---|---|
| **Reveal** — fade + 16–24 px rise, once | Section headers, cards | Motion `whileInView`, `viewport={{ once: true, amount: 0.2 }}` |
| **Stagger** — children 60–80 ms apart, max ~6 items | Program cards, activities, steps | Motion variants |
| **CountUp** | Hero / partnership stats | Runs once when visible; final number rendered in HTML for SEO/no-JS |
| **Scroll progress** | Blog article top bar | CSS `animation-timeline: scroll()` with `@supports` fallback (hidden) |
| **Subtle parallax** | Hero decorative shapes only | CSS `view()` timeline, ≤ 40 px travel; never on text |
| **Page transition** | Route changes on public site | View Transitions API (cross-fade 200 ms + shared hero image where natural) |
| **Micro-interactions** | Buttons (press), cards (lift 4 px + `shadow-lg`), form success check | CSS transitions; Motion only when physics is needed |
| **Skeletons** | Cek Unit results, admin tables | Shimmer-free pulse (opacity), respects reduced motion |

### 3.3 Rules
- Animate **only `transform` and `opacity`** (and `clip-path` sparingly). Never animate layout properties.
- Use `LazyMotion` + `m` components with `domAnimation` features; import from `motion/react`.
- Motion code lives in small client leaf components; sections stay Server Components and wrap content in `<Reveal>`.
- **No scroll-jacking**, no smooth-scroll libraries, no autoplaying carousels, no animation blocking LCP (the hero headline and image render visible immediately; only decorative elements animate in).
- `prefers-reduced-motion: reduce` → disable translate/parallax/count-up, keep instant opacity changes. Use `MotionConfig reducedMotion="user"` plus a CSS media query.
- Each page: at most one "hero moment"; everything else is quiet reveals.

---

## 4. Components

Built on shadcn/ui primitives, restyled with tokens. Domain components live in `src/features/<domain>/components`.

| Component | Variants / notes |
|---|---|
| **Button** | `primary` (teal), `partner` (orange-600), `whatsapp`, `secondary` (outline teal), `ghost`, `link`; sizes `sm` 40 / `md` 48 / `lg` 56 px height; `loading` state with spinner + disabled; icon left/right. Min touch target 44×44. |
| **Badge** | Level: `Kindy` (sunny), `Intro` (teal), `Secondary` (orange). Quota: `Tersedia` (success), `Sisa N slot` (warning), `Penuh` (error), `Unit baru` (info). Always text + color, never color alone. |
| **Cascading region select** | Province → Regency → District → Village. Each disabled with a hint until the parent is chosen ("Pilih kabupaten dulu"). Searchable (combobox) because lists can exceed 50 items. State synced to the URL. |
| **Search** | "Cari nama unit, kecamatan, atau kota…" — combobox with grouped results (Units / Areas), debounced 250 ms, server-side `pg_trgm`. |
| **Card · Program** | Image, level badge, age range, 3 bullet skills, link. Whole card clickable (one link, stretched). |
| **Card · Unit** | Initials avatar, name, unit code, quota badge, address, manager, schedule, level badges, actions: **Chat WhatsApp** (primary) + **Lihat Rute** (Google Maps directions link). |
| **Section header** | Overline + H2 + optional lead paragraph; left-aligned on mobile, centered optional on desktop. |
| **Navbar** | Desktop: links + "Gabung Mitra" CTA. Mobile: logo + "Cek Unit" icon button + menu sheet. Becomes compact with `shadow-md` after 8 px scroll. Locale switcher ID/EN. |
| **Sticky mobile action bar** | *(new)* Bottom bar on mobile, context-aware: parents pages → "Cek Unit" + WhatsApp; partnership pages → "Cek Kuota" + "Daftar Mitra". Hidden while the on-page form is in view. |
| **Accordion (FAQ)** | Native `<details>` styled, or Radix Accordion; content always in HTML for `FAQPage` schema. |
| **Testimonial** | Quote, name, role ("Orang tua siswa Kindy", "Mitra Kab. Bogor"), optional photo and rating. Horizontal scroll-snap list on mobile, grid on desktop (no auto carousel). |
| **Form field** | Label above, helper/error text below, error announced via `aria-describedby`; inline validation on blur, not on every keystroke. |
| **Toast** | Sonner, top-center on mobile, bottom-right on desktop. |

---

## 5. Pages & user journeys (public)

### 5.1 Primary journeys
**Parent:** Landing (Google/IG/WA) → understand programs & age fit → find nearest unit → **chat unit via WhatsApp** (pre-filled message with child age & level) → placement test at unit.

**Prospective partner:** Landing (ads/Google "peluang usaha kursus") → partnership value & cost → **check village quota** → **submit application form** (stored in DB) → confirmation + notification → admin follow-up.

**Cross-over:** A parent whose area has no unit is offered "Belum ada unit di desamu — jadilah mitra pertama" with quota shown. This turns dead-end searches into partner leads.

### 5.2 Page-by-page enhancements over Penpot

| Page | Penpot baseline | Enhancements |
|---|---|---|
| **Beranda** | Hero, stats, 3 levels, activities, Cek Unit, 3 steps, partnership teaser, testimonials | Hero offers a **dual path** (Parent: "Cek Unit Terdekat" / Partner: "Peluang Kemitraan" text link). Stats computed from DB with CountUp. **Age picker chip** ("Usia anak: 4–6 / 7–9 / 10–15") highlights the matching level. Inline Cek Unit is a compact version that deep-links to `/cek-unit?…`. Testimonials as scroll-snap. |
| **Program** | Level sections, activities, why BEC, FAQ, CTA | Sticky in-page tabs (Kindy · Intro · Secondary) with scroll-spy. Each level has its own URL anchor + `Course` schema. Comparison table on desktop, stacked cards on mobile. FAQ with schema. |
| **Cek Unit** | Cascading selects + unit list | **"Gunakan lokasi saya"** (Geolocation → nearest units sorted by distance, permission asked only on tap). Filters in URL (`?prov=32&kab=3201…`) — shareable and SEO-crawlable. Results show quota status. Empty state → partner cross-over CTA. Skeleton loading. |
| **Unit / area pages** *(new)* | — | Programmatic pages `/unit/[province]/[regency]` listing units with `LocalBusiness` schema and localized copy ("Kursus Bahasa Inggris Anak di Kab. Bogor"). Only regions with ≥1 active unit are indexed. Individual unit page `/unit/[...]/[unit-slug]`. |
| **Kemitraan** | Hero, stats, benefits, who fits, investment, 5 steps, quota check, stories, FAQ, CTA | Sticky secondary nav to sections; **quota checker inline** with live "Sisa N slot" badge (honest urgency, never fake). Investment block with clear inclusions; optional simple ROI estimate (inputs from admin settings). Application form at the end, also reachable from the sticky bar. |
| **Daftar Mitra** | WhatsApp-only flow | **Short form first** (name, WhatsApp number, region via cascading select, background, motivation, consent) → stored as a lead → success screen with "Lanjut chat admin" WhatsApp button pre-filled with the lead reference. Multi-step (2 steps) on mobile; progress indicator; data kept if user goes back. Turnstile + honeypot. |
| **Blog** | Featured post, grid, newsletter | Category filter chips (URL-based), pagination (not infinite scroll) for SEO, reading time, newsletter block optional (admin toggle). |
| **Blog detail** | Article, CTA | Reading progress bar, table of contents (desktop sticky, mobile collapsible), related posts, contextual CTA (parent vs partner per post category), share buttons (WhatsApp first), `Article` + breadcrumb schema. |
| **Kontak** | Navbar link only | Contact page: central WhatsApp, email, office address with map link, social links — all from settings. |
| **404 / error** *(new)* | — | Friendly illustration + search + links to Cek Unit and Program. |

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
