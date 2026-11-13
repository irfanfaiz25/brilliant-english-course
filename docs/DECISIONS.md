# Decision Log

Architecture decisions that later work must follow. Append new entries at the bottom with the
next number; never rewrite an accepted decision — supersede it with a new one.

Format: **ADR-NNN — Title** · Date · Status · Decision · Why · Alternatives considered.

---

### ADR-001 — Next.js full-stack, no separate backend

2026-11-13 · Accepted

- **Decision:** One Next.js (App Router, TypeScript) app serves the public site, admin dashboard and API (Server Actions + Route Handlers). Background work runs in a worker process from the same codebase.
- **Why:** SSR/SSG/ISR for SEO, one codebase and deploy, shared types and validation.
- **Alternatives:** Express/Nest backend (extra service, no benefit at this scale); Astro (great for content, but the dashboard would be a second app); Payload CMS (fast admin, but does not follow the custom dashboard design or the quota domain).

### ADR-002 — Hosting: VPS app + managed PostgreSQL, behind Cloudflare

2026-11-13 · Accepted

- **Decision:** App on a VPS (2 vCPU / 2 GB RAM / 60 GB), managed PostgreSQL 17 (1 vCPU / 1 GB RAM, 2 GB storage if needed) at Sumopod in the same region. Cloudflare in front. Images and extra backups on Cloudflare R2. Docker images are built in CI, not on the VPS.
- **Why:** Fixed low cost, managed DB backups, a long-running worker for notifications, DB isolated from app crashes.
- **Alternatives:** Vercel (commercial use needs Pro, serverless limits for workers, external DB anyway); single 4 GB VPS with self-managed DB (more ops, DB shares fate with app).
- **Follow-up:** Verify `pg_trgm`/`unaccent` with `pg_available_extensions` after provisioning. Storage can't be upgraded without migration, so monitor DB size in admin.

### ADR-003 — Data layer: PostgreSQL 17 + Drizzle ORM

2026-11-13 · Accepted

- **Decision:** Drizzle ORM and drizzle-kit SQL migrations; Postgres 17 locally via Docker to match production; `pg_trgm` + `unaccent` for region/unit search.
- **Why:** Type-safe SQL, reviewable migrations, lightweight runtime.
- **Alternatives:** Prisma (heavier engine, less SQL control).

### ADR-004 — UI stack

2026-11-13 · Accepted

- **Decision:** Tailwind CSS v4 with design tokens, shadcn/ui (Radix), Lucide icons, Motion (`LazyMotion`) + CSS scroll-driven animations + View Transitions.
- **Why:** Owned, accessible components; small motion footprint; brand tokens in one place.

### ADR-005 — Internationalization: next-intl, `id` default + `en`

2026-11-13 · Accepted

- **Decision:** Indonesian at `/` (no prefix), English at `/en`. Localized content in `<entity>_translations` tables with fallback to `id`. Admin UI in Indonesian (strings still via next-intl).
- **Why:** Primary audience is Indonesian; English supports SEO reach and credibility.

### ADR-006 — Roles and partner access

2026-11-13 · Accepted

- **Decision:** Better Auth with roles `super_admin`, `admin`, `editor`, `mitra`. The `mitra` role is modeled from day one (scoped to its unit) but the partner portal ships in a later phase.
- **Why:** Avoids reworking the auth and permission model when partners get login.

### ADR-007 — Partner applications go through a form stored in the DB

2026-11-13 · Accepted

- **Decision:** The "Daftar Mitra" flow submits a short form that creates a lead in the database (visible in admin), then offers a pre-filled WhatsApp handoff. Notifications (email / Telegram / WhatsApp) to applicant and owner are sent by the worker; providers are chosen in Phase 6.
- **Why:** Leads are never lost in chat history; the pipeline can be tracked and measured.

### ADR-008 — Dynamic content, fixed layout; hybrid SEO

2026-11-13 · Accepted

- **Decision:** Admins edit structured content and settings (contact, WhatsApp templates, hero text, programs, activities, FAQ, testimonials, partnership info, quota rules, notification settings) but not page layout. Site statistics are computed from data. SEO metadata: admin override → content-derived default → global default; technical SEO (sitemap, robots, canonical, hreflang, JSON-LD) stays in code; `noindex` is super-admin only.
- **Why:** Non-developers can keep the site current without breaking design or indexing; thousands of area/unit pages need automatic metadata.

### ADR-009 — Phased delivery and git workflow

2026-11-13 · Accepted

- **Decision:** Work follows `docs/ROADMAP.md` phase by phase. Branches `main` (production) and `staging`; feature branches are created from the latest `staging`; PRs into `staging`. Conventional Commits in English, no AI co-author trailers.
- **Why:** Small, reviewable changes; easy rollback; clear control over what ships.

### ADR-010 — Color tokens as global variables; white text on brand fills

2026-11-13 · Accepted

- **Decision:** All colors live as CSS variables in `src/styles/globals.css` in two layers (palette → semantic). Components use semantic tokens only; no raw hex anywhere. New special colors are added there once and reused; JS reads them via `src/lib/design-tokens.ts`. White text on `orange-500` and `whatsapp` fills is accepted (semibold, ≥ 16 px).
- **Why:** Rebranding or adjusting a color is a one-file change; brand look matches Penpot.
- **Alternatives:** Darker `orange-600` / dark text on WhatsApp green for strict AA contrast — rejected by the product owner for brand consistency.

### ADR-011 — Phase 1 tooling choices

2026-11-13 · Accepted

- **Decision:** Next.js 16 with Cache Components and Turbopack (defaults from `create-next-app`); `pg` (node-postgres) as the only Postgres driver, shared by Drizzle and pg-boss; ESLint + Prettier (not Biome); Husky + lint-staged + commitlint; local Postgres on host port 5433. ESLint enforces three architecture rules: no raw colors, no `process.env` outside env modules, no `@/db` imports from `app/` or `components/`.
- **Why:** One driver and one connection pool; rules that matter are enforced by tooling, not only by review.
- **Alternatives:** `postgres.js` driver (would mean two drivers once pg-boss is added); Biome (faster, but `eslint-config-next` rules are Next-specific).

### ADR-012 — Locale routing details

2026-11-13 · Accepted

- **Decision:** next-intl with `localePrefix: "as-needed"` (`/` = Indonesian, `/en` = English), **no locale detection** (no `Accept-Language`, no locale cookie), localized pathnames mapped in `src/i18n/routing.ts` (route folders use Indonesian paths), hreflang via page metadata (not response headers), and the locale read through `next/root-params`. Only the message namespaces Client Components need are sent to the browser.
- **Why:** Many Indonesian parents use phones set to English; auto-redirecting them to `/en` would hide the primary-language site. Localized URLs help SEO in both languages. Root params are the supported path with Cache Components; small client payload keeps public pages fast.
- **Alternatives:** Browser-language detection (rejected for the reason above); Next.js built-in dictionaries without next-intl (would rebuild ICU formatting, typed messages and navigation helpers ourselves).

### ADR-013 — UI primitives and internal design preview

2026-11-13 · Accepted

- **Decision:** shadcn/ui is used only as a source generator; every primitive in `src/components/ui` is rewritten with BEC tokens and owned by us. `cn()` extends tailwind-merge with our custom token names. Forms use a render-prop `Field` that wires accessibility attributes. FAQ accordion panels are force-mounted so answers stay in the HTML. An internal `/design-system` page previews tokens and primitives; it is noindex and served only when `ENABLE_DESIGN_PREVIEW` is true (default on outside production). Interactivity follows `DESIGN.md` § 1.2.
- **Why:** Consistent, accessible components with no design drift; reviewers can check every primitive at a glance on staging; SEO keeps FAQ content.
- **Alternatives:** Using shadcn defaults unchanged (generic look, conflicts with tokens); Storybook (extra tooling and build for a small component set).

### ADR-014 — Motion primitives

2026-11-13 · Accepted

- **Decision:** Motion (`motion` package) loaded through a strict, lazily-loaded `LazyMotion` (`domAnimation`) with `MotionConfig reducedMotion="user"`. Primitives: `Reveal`, `Stagger`/`StaggerItem`, `CountUp`, plus CSS-only `ScrollProgress` and a React `<ViewTransition>` page cross-fade mounted in `[locale]/template.tsx`. CountUp never resets a number that is already on screen. A `<noscript>` rule keeps reveal targets visible without JS.
- **Why:** Smooth, consistent motion with a small JS cost; native browser features (scroll-driven animations, View Transitions) where they exist; no accessibility or SEO regressions.
- **Alternatives:** GSAP (heavier, imperative, more than we need); pure CSS `view()` reveals (no "once" behavior, reverse on scroll up).

### ADR-015 — Site shell and layered depth

2026-11-13 · Accepted

- **Decision:** One `SiteShell` (skip link, sticky header, main landmark, footer, mobile action bar) frames every public page and the localized 404. Header elevation uses an IntersectionObserver sentinel, not scroll listeners. Navigation lives in `src/config/navigation.ts`; WhatsApp links go through `buildWhatsAppUrl()`. Visual depth comes from tokens: gradients, `DecorBlob`, `shadow-card`/glow shadows, `surface-glass` and `inverse-*` colors for dark bands. Brand icons come from `simple-icons` (only the needed glyph paths are imported).
- **Why:** Consistent frame and journeys on every page; the product owner asked for a less flat, more dimensional look while staying light and on-brand.
- **Alternatives:** Hand-drawn brand SVGs (risk of inaccurate logos); scroll event listeners for the header (more main-thread work).

### ADR-016 — UI-first pages on typed fixtures

2026-11-13 · Accepted

- **Decision:** Public pages are built before the database. Each domain exposes `queries.ts` functions with the final signatures (`getLevels(locale)`, `getActivities(locale)`, `getNetworkStats()`), cached with `"use cache"`, `cacheTag` and `cacheLife`. For now they return Zod-validated fixtures from `fixtures.ts` (content from Penpot, marked PLACEHOLDER). Page sections are colocated next to their page in private folders (`_home/`). Placeholder photos come from Unsplash (free license, credited) and are referenced through one config module.
- **Why:** The product owner can review real pages early; swapping fixtures for SQL later changes only `queries.ts`, and cache tags are already in place for admin revalidation.
- **Alternatives:** Build the database and admin first (slower feedback on the public UX); hard-coding content inside components (would need rewrites later).

### ADR-017 — Unit finder: URL state, server results, location on tap

2026-11-13 · Accepted

- **Decision:** The Cek Unit page keeps all state in the URL (`q`, `wilayah` = deepest region code, `lat`/`lng` rounded to 3 decimals, `dekat`). Results and the region cascade are computed on the server from that URL (`parseFinderParams`, `searchUnits`), streamed behind `Suspense` on first load and swapped in place via `router.replace` in a transition afterwards. Native selects for the cascade; geolocation only on an explicit tap. Empty areas route to the partnership form with the region pre-filled.
- **Why:** Shareable, crawlable and back-button-friendly searches; no client data fetching; works without JS; best native pickers on phones; privacy-friendly location handling; turns dead ends into partner leads.
- **Alternatives:** Client-side filtering with all units shipped to the browser (does not scale to the real network); separate `prov/kab/kec/desa` params (redundant — the code already encodes the hierarchy).

### ADR-018 — Partner application before the leads table

2026-11-13 · Accepted

- **Decision:** The Kemitraan form is built now on the final contract: one Zod schema (`features/partners/schema.ts`) validates in the browser (React Hook Form) and in the Server Action; validation messages are stable codes translated by the UI. The action runs validate → honeypot → per-IP rate limit (in memory, `limits.partnerApplication`) → village quota check → `createPartnerLead()` and returns `ActionResult` with a reference and a pre-filled WhatsApp link. Village quota = active units + slots reserved by onboarding partners, max `limits.unitsPerVillage` (2). Until Phase 3/4d `createPartnerLead()` does **not** persist anything (PLACEHOLDER) and reservations are fixtures. Turnstile is added with the production keys (Phase 7); the audit log and notifications come with the leads table (Phases 3, 6).
- **Why:** The product owner can review the full partner journey now; swapping the placeholder for an insert changes only the service. Shared codes keep client and server messages identical in both locales.
- **Alternatives:** Waiting for the database (blocks UX review); a WhatsApp-only flow (leads get lost, ADR-007); a Redis rate limiter (extra service for one instance).

### ADR-019 — Blog content, localized slugs and index state

2026-11-13 · Accepted

- **Decision:** Post bodies are stored as the Tiptap JSON document, restricted to a validated subset (`features/blog/schema.ts`: paragraph, heading 2–3, lists, blockquote, bold/italic/link, hard break) and rendered by our own server component (`RichText`) — no editor code ships to readers. Each post has one translation per locale with its own slug; `/blog/[slug]` prerenders every slug, sets hreflang to the other locale's slug, and a slug from the other language permanently redirects to this language's slug (keeps the language switcher working). The index keeps `?kategori=` and `?halaman=` in the URL; filtered and paged variants share the index canonical. Reading time and heading anchors are computed from the document, never stored. Until Phase 4e posts are fixtures (PLACEHOLDER).
- **Why:** Safe, small and SEO-friendly rendering; localized URLs for both audiences; shareable filters without client JS.
- **Alternatives:** Storing HTML (XSS risk, styling drift); rendering with `@tiptap/html` (extra dependency for a subset we control); the same slug in both languages (weaker English SEO).
- **Known limitation:** Because pages stream, an unknown slug or a cross-language redirect is resolved after the shell is sent (404 page with `noindex`, client redirect). Real 404/308 status codes for these can move into `src/proxy.ts` during Phase 7.

### ADR-020 — Contact via a WhatsApp composer, details from settings

2026-11-13 · Accepted

- **Decision:** The Kontak page routes visitors first (parents → their unit, partners → Kemitraan, others → email) and offers a message composer whose validated text opens in WhatsApp (`features/contact/schema.ts`). It has no Server Action and stores nothing. Head-office details (WhatsApp, email, address, office hours, socials) come from `getContactSettings()` in the `settings` domain, which returns code defaults until the settings module (Phase 4a).
- **Why:** WhatsApp is where parents already talk to BEC and where admins answer. A server-side contact form would add storage, spam protection and notifications for little gain. Partner leads keep their own stored form (ADR-007, ADR-018).
- **Alternatives:** A stored contact form with email notifications (more moving parts, slower replies); an embedded Google Map (heavy third-party script; a directions link is enough).

### ADR-021 — Unit and area pages from a unit directory

2026-11-13 · Accepted

- **Decision:** Local SEO pages live under `/unit` (EN `/units`) as one catch-all route resolved against a unit directory (`features/units/directory.ts`): province → regency → unit, built from active units and Kemendagri regions. Slugs are `slugify(name)`, made unique among siblings by appending the code. Units get an explicit `slug` field (admin-editable later). Only provinces and regencies with at least one active unit exist, so there are no thin or empty pages. All paths are prerendered; unknown paths render the 404 page with `noindex`. Cards link to unit pages, and finder results' `LocalBusiness` data points at them. Districts and villages stay in the Cek Unit filter, not separate pages.
- **Why:** Matches how parents search ("kursus bahasa inggris anak kab bogor"); human-readable, stable URLs; content on every indexed page; one place to compute paths, so links, JSON-LD and static params agree.
- **Alternatives:** Code-based URLs (`/unit/32.01`, unreadable); a page per district or village (thousands of thin pages); separate route files per level (duplicated resolution logic).

### ADR-022 — First-viewport content is never hidden at load

2026-11-13 · Accepted

- **Decision:** Content that can sit in the first viewport never starts at `opacity: 0`. Large hero text (the `PageHero` lead, home and Kemitraan leads) uses `animate-lift-in` (translate only); `Reveal` and `Stagger` take `immediate` for blocks right under the hero (first Program level, unit facts card). Smaller hero items (breadcrumb, overline, chips) keep the CSS `animate-rise-in` fade. Accessibility fixes from the Phase 5 audit are kept in shared components: accessible names start with the visible text (locale switch, age chips), screen-reader-only copies instead of `aria-label` on plain elements (`CountUp`, ratings), valid `<dl>` rows (`FactRow`), accordion heading level as a prop, stretched card links draw the standard focus outline on their overlay. Brand fills keep the ADR-010 contrast exception; small partner text on soft surfaces uses `partner-strong`.
- **Why:** Chrome reports text painted at opacity 0 only when it is repainted after hydration, which pushed LCP to ~4 s on Program, Kontak and unit pages (1.5 s after the change). One fix in shared components covers every page.
- **Alternatives:** Removing hero motion entirely (loses the brand feel); starting fades at a tiny non-zero opacity (relies on a browser heuristic); darker brand fills for strict AA (rejected in ADR-010).

### ADR-023 — Region data: Kemendagri codes from a pinned upstream dataset, checked into the repo

2026-11-14 · Accepted

- **Decision:** The `regions` table holds Indonesia's administrative hierarchy keyed by Kemendagri code (province `32` → regency `32.01` → district `32.01.01` → village `32.01.01.2001`). The source is `db/wilayah.sql` from the MIT-licensed `cahyadsn/wilayah` mirror (Kepmendagri No. 300.2.2-2430 Tahun 2025), pinned to one commit. `scripts/build-regions.ts` converts it into `src/db/seed/regions/regions.csv` (`code,name`, 91,599 rows) plus `regions.meta.json` (commit, SHA-256, counts, rows skipped because their parent is missing); `pnpm db:regions` derives level and parent from the code and upserts the rows in batches, reports codes that disappeared upstream without deleting them, then times the two hot queries. Names are stored in their official long form ("Kabupaten Bogor", "Daerah Khusus Ibukota Jakarta"); shortening for cards and URLs is done in code. The upstream SQL writes apostrophes as `''` ("Ma'u", "Hu'u", "Kaliau'"); the parser unescapes them and fails the build if any tuple is left unparsed, so names are never dropped silently. The pinned commit yields 38 provinces, 514 regencies, 7,285 districts and 83,762 villages with no skipped rows; any future orphan (a village whose district is missing upstream) is skipped so the self-referencing foreign key holds, and listed in the meta file for review.
- **Why:** Village quota ("max 2 units per desa") and area URLs need stable, unique identifiers; postal codes (the `administrative_regions` table in the owner's other database) are shared by many villages and merge same-named regencies and cities. A checked-in file gives every environment — laptops, CI, staging, production — the same data through the normal deploy pipeline, with changes visible in Git, and keeps BEC independent of other databases.
- **Alternatives:** Importing the owner's `administrative_regions` table (no unique village id, 489 instead of 514 regencies, inconsistent naming); merging its village coordinates by name (fragile matching for a feature nothing needs yet — unit distances use the unit's own coordinates; if village coordinates are ever needed, `cahyadsn/wilayah_kodepos` maps postal codes to Kemendagri codes); loading the upstream SQL at runtime or from a submodule (no review of changes, MySQL syntax).

### ADR-024 — Schema conventions for the domain tables

2026-11-14 · Accepted

- **Decision:** One schema file per domain under `src/db/schema`, with shared helpers (`id()` = `uuid` default `gen_random_uuid()`, `timestamps`, `softDelete`, `localeEnum`). Enum value lists live once in `src/config/enums.ts` (a module with no imports) and are re-exported by the owning `features/<domain>/schema.ts`, because the same lists feed Zod in the browser and `pgEnum` in drizzle-kit, which cannot resolve the `@/` alias. Translation tables use the composite primary key (`entity_id`, `locale`). Site settings are one JSON document per key in `settings`, validated per key in `features/settings` with code defaults. Images go through a `media_assets` library (`key` = R2 object key or bundled path); alt text stays with the localized content. `users` follows Better Auth's core user model plus `role`, `unit_id` and `is_active`; its session/account/verification tables arrive with the library in Phase 3b. `partner_leads` keep a hashed IP, never the raw address. Reference and log tables (`regions`, `audit_log`, `notification_log`, `partner_lead_notes`) have no `updated_at`.
- **Why:** The whole model is reviewable in one migration (`0001_domain_schema`) before any admin module exists; fixtures and the public pages already use these exact value lists, so Phase 3c can swap `queries.ts` to SQL without touching components. Composite keys and JSON settings avoid surrogate ids and migrations that carry no information.
- **Alternatives:** Defining the lists in each `features/*/schema.ts` and duplicating them in `src/db/schema` (two sources that drift); configuring a path-alias loader for drizzle-kit (unsupported, fragile); a column per setting (a migration for every new field); UUID v7 generated in the app (`uuidv7()` will come from Postgres 18 instead; v4 is fine at this scale).
