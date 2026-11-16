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

2026-11-13 · Accepted · Content subset and required English amended by ADR-032

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

### ADR-025 — Staff authentication and permissions

2026-11-14 · Accepted

- **Decision:** Better Auth (email + password) on the Drizzle adapter, configured in `src/lib/auth.ts`, with its core tables named `users`, `sessions`, `accounts`, `verifications` (migration `0002_auth_tables`). Self sign-up is disabled: accounts come from `pnpm auth:create-user` (first super admin, password resets by an operator) and later the Users module (Phase 4g). `role`, `unit_id` and `is_active` are additional user fields no request can set. There is **no `/api/auth` route**: sign-in, sign-out and password reset are Server Actions (`features/users/actions.ts`) that validate with the forms' Zod schemas, rate-limit failed sign-ins per email and per client IP (loopback/unknown IPs fall back to email only; successful sign-ins clear the email counter) and call `auth.api.*`; `nextCookies()` writes the cookie. Sessions last `limits.auth.sessionDays` (7) and are refreshed daily; a password reset revokes every session; inactive accounts cannot create a session and are treated as signed out by the session guard. Reset tokens are stored hashed and expire after `limits.auth.resetLinkMinutes` (60); until the email channel exists (Phase 6) the link is printed to the server console outside production only. Staff pages live under `/admin` (own root layout, Indonesian, `noindex`): `/admin/masuk`, `/admin/lupa-password`, `/admin/reset-password`. `src/proxy.ts` only redirects visitors without a session cookie; the real check is the data access layer `features/users/session.ts` (`getCurrentUser`, `requireUser`, `requirePermission`), called next to the data behind `<Suspense>`, never in a layout. Authorization is a hand-written matrix in `src/lib/permissions.ts`: `can(actor, action, resource | { resource, unitId })` over 15 resources and 5 actions; super admin has everything; admin manages operations and content but only reads users and the audit log; editor manages content, media and SEO text; mitra can read and update its own unit only; `seoIndexing` (noindex) and user management are super-admin only; inactive or signed-out actors get nothing. The test mirrors the whole matrix by hand.
- **Why:** No browser auth client and no public HTTP surface keeps the attack surface and the JS payload small, and fits the project's Server Action pattern (`ActionResult`, translated codes). One permission module with an exhaustive test makes every role change deliberate. Hashed tokens and session revocation limit the damage of a leaked backup or a stolen session.
- **Alternatives:** Mounting Better Auth's catch-all route with its React client (larger surface: sign-up, update-user and other endpoints to disable one by one; client bundle on admin pages); the admin plugin for roles (its role model and endpoints don't match the mitra unit scoping); NextAuth/Auth.js (credentials provider discouraged, no built-in password reset); checking sessions in a layout (not re-run on navigation, does not protect nested segments or actions).
- **Known limitation:** Password-reset emails are not delivered in production until Phase 6; until then an operator resets a staff password with `pnpm auth:create-user --email … --reset-password`. The in-memory rate limiter assumes one app instance (same as ADR-018).

### ADR-026 — Database-backed public pages, dev seed and the admin shell

2026-11-14 · Accepted

- **Decision:** Every public `queries.ts` now reads Postgres with the same signatures and cache tags as the fixtures it replaces (ADR-016), so components did not change. Region names are stored official (ADR-023) and shortened for display by `shortRegionName()` ("Kabupaten Bogor" → "Kab. Bogor", "Kota Administrasi Jakarta Selatan" → "Kota Jakarta Selatan", "Daerah Khusus Ibukota Jakarta" → "DKI Jakarta"), which keeps URLs such as `/unit/jawa-barat/kab-bogor`. Translations fall back from `en` to `id` (`pickTranslation`). Settings are read per key and validated, falling back to code defaults (`features/settings/defaults.ts`, `features/partners/defaults.ts`); only the raw JSON is cached because cached functions accept serializable arguments only. Network statistics, quota and featured units are computed with SQL. Partner applications are stored (`partner_leads`) with an audit row in one transaction, the client IP kept only as a keyed hash; reference clashes are retried. The former fixtures moved to `src/db/seed/content` as sample content for `pnpm db:seed` (local Docker or CI only, refuses other hosts and `NODE_ENV=production`; `--reset` replaces seeded content and `MTR-DEV-*` sample leads, never users, settings or real leads) and for unit tests; sample units now sit on real Kemendagri village codes. Public pages are prerendered from the database at build time, so CI loads regions and the seed before `pnpm build`. The admin shell (`app/admin/(dashboard)/layout.tsx`, `components/admin`) is a light glass layer over the brand gradient: `surface-glass-panel` sidebar (icon rail at `lg`, labelled from `xl`, left sheet below `lg`), sticky top bar with the account menu, content up to 1280 px. Navigation is one config (`src/config/admin-navigation.ts`) filtered on the server with `can(user, "read", resource)`; session-dependent parts stream behind their own `<Suspense>` and the layout never awaits the session. Admin data functions (`features/*/admin-queries.ts`) take the user and call `assertCan()` first. Each Phase 4 module has a guarded placeholder at its final URL (`app/admin/(dashboard)/[section]`), and forbidden or unknown admin URLs share one not-found page.
- **Why:** Real data paths before the admin forms means Phase 4 only adds writes; the public UI stays exactly as reviewed. Seeding from the reviewed content keeps E2E and visual checks meaningful. Glass panels follow the product owner's request for a lighter, more dimensional admin without new colors or heavy effects; the permission-filtered menu and same-404 rule keep the UI honest without making it the security boundary.
- **Alternatives:** Keeping fixtures until each admin module ships (two data paths per domain for months); runtime-only (dynamic) public pages to avoid a database at build time (slower first byte, loses prerendering); a separate admin UI kit (inconsistent with the site's tokens); hiding forbidden modules without a server check (not authorization).
- **Follow-up:** Phase 8 must give the image build access to a database (or build against a migrated, seeded snapshot) because prerendering reads it.

### ADR-027 — Admin settings and SEO overrides

2026-11-14 · Accepted

- **Decision:** Pengaturan (`/admin/pengaturan`, resource `settings`) saves the `contact` and `partnership` keys; SEO
  (`/admin/seo`, resource `seo`) saves the `seo` key (site-wide description per locale) and `seo_overrides` rows of
  the static pages (`seoPageKeys`, route keys `home`, `program`, `finder`, `units`, `partnership`, `blog`, `contact`).
  Setting schemas validate both the stored JSON and the forms; their messages are error codes. Actions follow
  validate → authorize → transaction (row + `audit_log` with `before`/`after`) → `updateTag()` so the editor sees the
  change at once. An override field left empty is stored as `NULL` and a locale left fully empty loses its row, so
  the defaults apply again. `noindex` applies to both locales of a page and only a user who may update `seoIndexing`
  (super admin) changes it; for others the stored value is kept. Override titles keep the page's title shape: the
  site-name template is added unless the page's title is complete (home). Contact placeholders moved from
  `siteConfig` to `features/settings/defaults.ts`; public components read `getContactSettings()`. The admin
  timestamps are shown in Asia/Jakarta.
- **Why:** Contact details and SEO texts change without a deploy, and every change is attributable. One schema per
  setting keeps the browser, the action and public reads in agreement; a broken stored document still falls back to
  code defaults instead of breaking pages.
- **Alternatives:** Keeping contact values in code (needs a developer for a phone number change); a generic key/value
  editor (no validation, easy to break the site); `revalidateTag` with stale-while-revalidate (the admin would see the
  old value right after saving); per-locale `noindex` (no use case, easy to misconfigure).
- **Follow-up:** Programs, posts and units reuse `applySeoOverride()` with their own editor in 4b, 4c and 4e;
  WhatsApp message templates and hero texts stay in messages until a module needs them editable.

### ADR-028 — Program levels and activities in admin

2026-11-14 · Accepted (levels: superseded by ADR-038)

- **Decision:** The three program levels are fixed (`levelSlugs` drive URLs, anchors and the level colors): admins edit
  a level's ages, sessions, class size, photo, visibility and bilingual copy, but cannot add, rename or delete one. A
  level's age range may not overlap another level's (`overlapsAgeRange`), so the home age finder stays unambiguous.
  Activities have full CRUD: the slug is derived once from the Indonesian name (`uniqueSlug`), new ones go to the end,
  order changes with up/down (the list is renumbered 0…n in one transaction), and deletion is hard (no soft delete for
  activities) with the names kept in the audit row. Both locales are required for levels and activities (short copy,
  fully bilingual site). Images are picked from `media_assets` until uploads land in 4e. Visibility is a separate
  `publish` permission: the switch on the list and the checkbox in the form are shown only to publishers, and the
  services keep the stored value for others. Admin actions share `guardedAction()`; settings and SEO actions from 4a
  moved onto it. Levels have no own URL, so their SEO stays with the Program page in the SEO module.
- **Why:** Free-form levels would break the level theme and the URLs; the fields that change (ages, copy, photos) are
  editable. Up/down buttons are keyboard- and screen-reader-friendly without a drag-and-drop dependency. One action
  pipeline keeps validation, authorization, audit and cache expiry identical across modules.
- **Alternatives:** Drag-and-drop ordering (new dependency, weaker accessibility); optional English translations with a
  fallback (half-translated pages and harder validation for little gain); soft delete for activities (no restore UI is
  planned, the audit row keeps what was removed).
- **Follow-up:** 4e adds uploads to the media picker; blog posts may allow a missing English translation (ADR then).

### ADR-029 — Units and regional quota in admin

2026-11-14 · Accepted

- **Decision:** Units get their code once, when created: `BEC-<ISO 3166-2:ID province letters>-<4 digits>`, one above
  the highest code ever issued in that province (deleted units keep theirs), under an advisory lock. The slug is
  suggested from the name and must be unique among live units of the same regency. Statuses: `onboarding` (not public,
  no quota), `active` (public, takes a village slot), `inactive` (hidden, slot freed). Activating a unit in a village
  whose active units plus open reservations reach the maximum is refused with a field error; quota checks lock per
  village. Deleting a unit is a soft delete. The quota rules (`unitsPerVillage`, `almostFullAt`) became the `quota`
  setting with `limits` as code defaults; Kemitraan and the quota checker read it. Reservations are created (slots,
  optional end date at 23:59 WIB, note) and released; expired ones stop counting. The village is chosen with a
  cascade of native selects that load children through a staff-only Server Action. Units are not translated, so
  their preview is Indonesian; `UnitCard` was split into a pure `UnitCardView` and a server wrapper for it.
- **Why:** Stable, readable codes for staff and partners; URLs that never collide; the quota stays honest without
  manual bookkeeping; the admin can tune the rule without a deploy.
- **Alternatives:** A global code sequence (loses the province hint); hard delete (breaks the audit trail and could
  reuse codes); letting admins override the quota (the reservation can simply be released first); a searchable
  combobox for 91k villages (heavier, worse on phones than native selects).
- **Follow-up:** 4d links reservations to leads from the pipeline; unit photos (`unit_photos`) get an editor with the
  media module (4e). Site copy that names the per-village limit reads it from the setting (done in 4d); FAQ
  answers are content and are edited by staff.

### ADR-030 — Partner leads pipeline in admin

2026-11-14 · Accepted

- **Decision:** Leads move through `new → contacted → qualified → onboarding → converted`, with `rejected` and `lost`
  as closed exits; staff may move a lead to any stage (no enforced order). Status, assignee and an optional note are
  saved together; every change writes an audit row and the detail page shows those rows plus notes as one history.
  Entering `onboarding` reserves one slot in the lead's village (a `quota_reservations` row linked by `lead_id`, under
  the same per-village advisory lock and full-village check as units); leaving it, or deleting the lead, releases the
  slot. "Buat unit dari calon mitra ini" opens the unit form prefilled from the lead; saving it releases the lead's
  slot before the quota check and marks the lead `converted` with its `unit_id`, in the same transaction (an onboarding
  unit keeps the slot until it is active: ADR-039). Leads are
  soft-deleted. The CSV export follows the list's filters, is capped at `limits.leads.exportMax` rows, is written with
  a BOM and CRLF for Excel, prefixes cells starting with `= + - @` (or tab/CR) with `'` against formula injection,
  is served `no-store` from a route that answers 404 without `read` on leads, and is recorded in the audit log.
- **Why:** A small team needs flexibility over a strict state machine, but the quota must stay honest: a partner who
  is setting up must not lose the village to someone else, and the slot must turn into the unit without a gap where
  another lead could take it. Lead data is personal data, so every export leaves a trace.
- **Alternatives:** A strict transition graph (blocks fixing a wrong click); reserving on `qualified` (holds slots for
  leads that often drop out); exporting through a Server Action (no streaming download, no `Content-Disposition`);
  XLSX export (a dependency for what spreadsheets already open as CSV).
- **Follow-up:** Phase 6 notifies the assignee and the applicant through the worker; the mitra portal (later phase)
  sees only its own unit, never leads.

### ADR-031 — Media uploads and storage

2026-11-14 · Accepted

- **Decision:** Images are uploaded from the browser straight to storage with a short-lived signed PUT URL, not
  through the app server: `startUploadAction` returns the URL for a raw object under `tmp/<uuid>`, the browser PUTs
  the file with `XMLHttpRequest` (real byte progress, cancellable), and `finishUploadAction` reads it back, turns it
  into a WebP (`sharp`: rotated upright, metadata stripped, longest side at most `limits.media.maxDimension` = 2400 px,
  quality 82), stores it under `media/<yyyy>/<mm>/<uuid>.webp` (cached for a year, keys never change), adds the
  `media_assets` row with its audit entry and removes the raw object. Storage is Cloudflare R2 when all four `R2_*`
  variables are set (then `NEXT_PUBLIC_MEDIA_URL`, the bucket's public custom domain, is required); otherwise the
  local driver writes to the git-ignored `.storage/` folder, takes uploads at `/api/media/upload` with an HMAC-signed
  token (the local stand-in for a presigned URL) and serves `media/…` at `/api/media/files/…`. JPEG, PNG and WebP up
  to 5 MB, 10 files per batch, two uploading at a time. `media_assets` gains `name` (searchable, editable) and
  `uploaded_by_id`. An image used anywhere (programs, activities, unit photos, posts, SEO images; deleted units and
  posts do not count) cannot be deleted; `usage.ts` lists every referencing table once for counts, the image page
  and the delete guard. New dependencies: `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` (R2's S3 API and
  presigned URLs) and `sharp` (image processing; already used by `next/image`).
- **Why:** Uploads do not load the small VPS, progress is real, and the same code path runs with or without R2, so CI
  and local development need no credentials. Storing only resized WebP keeps the bucket small and pages fast. Blocking
  deletion of used images means no page ever loses its picture.
- **Alternatives:** Uploading through a Server Action or route (server memory and bandwidth, no browser progress);
  resizing in the browser with canvas (uneven quality, EXIF orientation issues); keeping originals (storage cost for
  files the site never shows); soft delete for media (no restore UI; the audit row keeps the name and key).
- **Follow-up:** The bucket needs a CORS rule allowing `PUT` from the admin origins and a lifecycle rule deleting
  `tmp/` objects after one day (abandoned uploads). The temporary media domain can change by updating
  `NEXT_PUBLIC_MEDIA_URL` and rebuilding: rows store keys, not URLs. Blog cover images use the same picker (4e-2).

### ADR-032 — Blog editor, rich-text model and optional English

2026-11-14 · Accepted

- **Decision:** Staff write posts in admin (Blog) with a Tiptap v3 editor whose toolbar covers headings 2–4,
  bold/italic/underline/strike/inline code, brand text and highlight colors, alignment, lists, quote, code block,
  tables, images (from the media library with upload, or an `https` URL) with alt text and caption, YouTube embeds
  (rendered from `youtube-nocookie.com`), horizontal rules, HTML import, undo/redo and a word/character count. The
  stored document is the subset defined in `features/blog/rich-text.ts` (this replaces the subset of ADR-019):
  `sanitizeDoc()` runs on every save and every render, so pasted or imported markup, script URLs and off-brand colors
  never reach the site; colors are token names, not hex values. The public `RichText` stays a server component
  without editor code; the table of contents uses H2/H3 only. Library images in a body are kept in `post_images`
  (synced on save) so the media library counts them and refuses to delete them. Posts are `draft`, `published` or
  `archived`; publishing and archiving need the `publish` permission, and the publish time is entered in Jakarta time
  (`datetime-local`). Indonesian is required, English is optional: a post without English is not listed on `/en`, its
  hreflang lists only the written languages, and `/en/blog/<indonesian-slug>` redirects to the English blog index.
  The article page looks a post up by slug (cached per slug) instead of in the full list, so a post published after
  the build renders from the fallback shell instead of a stale copy of the list. Admin list searches (Media, Unit,
  Calon Mitra, Blog) apply while typing (`ListSearch`, 300 ms debounce, URL `q`, page reset) instead of a submit
  button. New dependencies: the Tiptap v3 packages for the editor (admin only).
- **Why:** Staff get the formatting they expect from common editors while the site keeps a small, safe and on-brand
  output. Optional English lets Indonesian articles go out without waiting for a translation.
- **Alternatives:** Storing HTML (XSS risk, styling drift); free color pickers (off-brand, low contrast); falling
  back to Indonesian on `/en` (mixed-language pages and duplicate content); a separate editor library (Tiptap is
  already the stored format).

### ADR-033 — Testimonials and FAQ in admin

2026-11-14 · Accepted · Ordering amended by ADR-034 (drag instead of up/down)

- **Decision:** Testimoni and FAQ are ordered lists edited in admin like Kegiatan: a list per group (testimonials by
  audience: parents on Beranda, partners on Kemitraan; FAQ by topic: parents on Beranda, program on Program, partners
  on Kemitraan) chosen with filter chips that show counts and live in the URL (`?audience=`, `?topic=`). Each row has a
  show/hide switch, move up/down within its group, edit and delete; "Add" opens the form for the group on screen, a
  new row goes to the end of its group, and changing a row's group moves it to the end of the new one. Both languages
  are required (short copy). A testimonial has a shared author name and a 1–5 star rating (native radio group) and a
  quote and context line per language, with a live preview of the public card; an FAQ answer is plain text whose line
  breaks show on the site (`whitespace-pre-line`) and which also feeds the `FAQPage` JSON-LD. Writes live in
  `features/<domain>/admin-service.ts` (transaction + audit row, `testimonial.*` / `faq.*`), go through
  `guardedAction()` and expire the `testimonials` / `faq` cache tags. The optional `testimonials.unit_id` is not
  edited yet: the context line already names the unit. Shared pieces extracted while building it: `lib/ordering.ts`
  (`moveInOrder`, `moveSchema`), `FilterChips` (the chip row of Blog, Unit Mitra, Calon Mitra, Media and the new
  lists) and `OrderedRowActions` (the row actions of Kegiatan, Testimoni and FAQ).
- **Why:** Staff manage what parents and partners read without a developer, in the same patterns they already know
  from Kegiatan; order matters per page, so it is kept per group rather than globally.
- **Alternatives:** One mixed list with a group column (ordering across pages is meaningless); drag-and-drop ordering
  (more client code and harder with a keyboard than up/down buttons); rich text for FAQ answers (the structured data
  needs plain text, and answers are short); optional English as for blog posts (testimonial and FAQ copy is short and
  every public section shows it in both languages).

### ADR-034 — Drag-to-reorder for ordered lists

2026-11-14 · Accepted

- **Decision:** Manually ordered lists are reordered by dragging instead of up/down buttons: Kegiatan, Testimoni and
  FAQ (`SortableList`, `components/admin`) and the list fields of content forms (`StringListField`: card highlights,
  curriculum, partnership inclusions). Both build on `Sortable`, a thin wrapper around Motion's `Reorder` (already in
  the stack) rendered with `m` components inside its own `LazyMotion` that loads `domMax` lazily, under
  `MotionConfig reducedMotion="user"`. Only a row's grip starts a drag (`dragListener={false}` + `useDragControls`,
  `touch-action: none` on the grip), so the page still scrolls on phones. Keyboard reordering is Motion's own (Space
  picks up and drops, arrows move, Escape restores); `Sortable` adds the instructions (`aria-describedby`) and a live
  region announcing each step. A list saves on drop with one action per module that takes the full new order of its
  list or group (`reorderSchema`: every id once and the moved id); the service locks that group, refuses with
  `orderChanged` when its rows are no longer exactly the ids sent (a row added or deleted elsewhere), renumbers
  0, 1, 2, … and writes one audit row (`*.reorder`, the moved row, its position and the order). The client shows the
  new order at once, runs saves one after another, and reloads the server's order after a refused or failed save.
  `moveInOrder`/`moveSchema` and the move actions are removed; the row actions become `ContentRowActions`.
- **Why:** Dragging is the expected way to order short lists, moves a row any distance in one gesture, and Motion
  already provides layout animation, auto-scroll, click suppression after a drag and keyboard support without a new
  dependency. Saving the whole order (not "one step up") makes every drop one request and detects stale lists.
- **Alternatives:** `@dnd-kit` (a new dependency for what Motion already does); native HTML5 drag-and-drop (no touch
  support, poor keyboard story); keeping up/down buttons next to the grip (more controls per row; the keyboard path
  already covers non-pointer use).
- **Known limitation:** WCAG 2.2 § 2.5.7 asks for a single-pointer alternative to dragging; here the alternative is
  the keyboard. If a user needs pointer-only reordering, add a "Pindahkan ke…" menu on the grip.

### ADR-035 — Users, roles and account activation

2026-11-14 · Accepted · Fixed role matrix amended by ADR-036 (configurable for admin/editor)

- **Decision:** Pengguna (`/admin/pengguna`) manages accounts; only super admins change them (`users` grants), admins
  read the list. Roles stay the four fixed roles of `permissions.ts`; the page shows the matrix from `grantsFor()` so
  the text cannot drift from what the server enforces. A new account is created without a password (`emailVerified`,
  active) and gets a **single-use activation link**: a Better Auth reset token (`reset-password:<token>`, stored hashed)
  created through `internalAdapter.createVerificationValue`, valid `limits.auth.accessLinkHours` (72 h), pointing to
  `/admin/aktivasi` (no password yet) or `/admin/reset-password` (has one). Better Auth's `resetPassword` consumes it
  and creates the credential account when missing. A new link deletes the account's earlier links; the link is shown
  once in a dialog and never logged (the audit row records only its kind and expiry). Until email exists (Phase 6) it is
  copied and sent by hand. A `mitra` account must name a live unit. Accounts are never deleted: disabling one ends its
  sessions and links at once (history and audit references stay). Rules in `features/users/rules.ts`: nobody changes
  their own role or disables themselves, and the last active super admin cannot be demoted or disabled (the active
  super admins are locked `FOR UPDATE` in the same transaction). Emails are unique case-insensitively. `users.last_sign_in_at`
  is set by a session-create hook. Akun saya (`/admin/akun`) lets every signed-in account change its name and its
  password (`changePassword` with the current one, other sessions revoked, rate-limited per account).
- **Why:** No password is ever shared or typed by someone else; the reset machinery is already tested and hashed;
  disabling keeps the audit trail intact; the two account rules prevent locking the team out.
- **Alternatives:** A temporary password set by the admin (shared secret that often stays); a separate invitation
  table and token (duplicates Better Auth's reset tokens); deleting accounts (breaks history and audit references);
  admins managing non-super-admin accounts (the user chose super admin only); custom roles (too much for a small team).
- **Follow-up:** Phase 6 emails the link instead of the copy dialog; the partner portal (Phase 9) builds on `mitra`
  accounts created here.

### ADR-036 — Configurable permissions for admin and editor

2026-11-15 · Accepted

- **Decision:** Super admins set what `admin` and `editor` may do in Pengguna › Hak akses (`/admin/pengguna/hak-akses`):
  a checkbox per module and action, one tab per role, "reset to default", saved as the `rolePermissions` setting
  (one JSON document, no migration; `saveSetting` writes the audit row and the `settings` tag expires). The code
  matrix in `permissions.ts` is the default. `getCurrentUser()` attaches the role's effective grants
  (`effectiveGrants()`, read through the settings cache) to the session user, and `can()` reads `actor.grants`, so
  every existing check is unchanged and a change applies from the next request. Guard rails that hold whatever is
  ticked or stored (`normalizeRoleGrants()`, applied by the schema on save and again on read; `can()` itself ignores
  grants for the other roles): super admin always uses the full code matrix; mitra keeps its unit-scoped default
  (unit scoping exists only for units); `users` can only be granted read (granting edit would let a role make itself
  super admin); only the actions a resource has can be granted (`resourceActions`, what the app checks) and any action
  brings read; `dashboard` (it also guards shared tools such as region search) and `auditLog` (no module yet) keep their
  defaults. The default matrix was aligned with `resourceActions` (leads `rud`, programs `rup`): nothing checked the
  removed actions. E2E global setup clears the setting so every run starts from the defaults.
- **Why:** The product owner wants to adjust access without a developer and takes responsibility for it; the guard
  rails keep the mistakes the app could not undo (lock-out, privilege escalation, data of other units) impossible.
- **Alternatives:** The fixed matrix of ADR-035 (less flexible); fully custom roles (more than a small team needs);
  per-account overrides (hard to oversee, and roles already group people).

### ADR-037 — Ringkasan: what needs action, partner-lead charts, hand-built SVG

2026-11-15 · Accepted

- **Decision:** Ringkasan shows only what staff act on or steer by, each section to roles that may read its data:
  "Perlu tindakan" (new leads not contacted for `limits.overview.staleLeadDays` = 2 days, open leads assigned to me,
  accounts awaiting activation, scheduled articles, villages almost full; each links to the filtered list), KPI cards
  (new leads in 30 days against the 30 days before, conversion over 12 months, active units, students), the
  partner-lead trend, the pipeline per status, regional demand (the 5 regencies with most leads in 12 months beside
  their active units), the latest leads and the activity log (`features/audit`, `auditLog` read). "Became a partner"
  means a unit was created from the lead: the trend counts `lead.convert` audit rows by the day they were written,
  only while the lead is still converted; conversion = converted ÷ leads of the last 12 months. Trend buckets are
  calendar days, ISO weeks or months in `adminTimeZone` (`features/partners/trend.ts`), the range in the URL
  (`?range=30d|12w|12m`, default 12 weeks). Charts are hand-built SVG (`AreaTrendChart`, `lib/chart.ts`: nice scale,
  monotone curve) with the validated `chart-1`/`chart-2` tokens, a hover and keyboard tooltip and a table view. Not
  charted: student numbers (no history; needs monthly snapshots, Phase 6), site visits, WhatsApp clicks and lead
  sources (not recorded yet). Shortcuts were dropped (the sidebar already lists the modules). The dev seed adds a
  deterministic year of sample applications and conversions (`seed/content/lead-history.ts`), none newer than two
  weeks so earlier specs keep their numbers.
- **Why:** The overview should answer "what do I do today" and "is the network growing"; the partner pipeline is
  the business's main flow and the only one with history. Hand-built SVG keeps the admin bundle small, matches the
  design tokens exactly and stays accessible; a library would add weight for one area chart.
- **Alternatives:** Recharts or another chart library (heavier, harder to theme and to make keyboard-accessible);
  more charts (unit growth, articles per month: little to act on); counting conversions from the lead's
  `updated_at` (moves with any later edit).

### ADR-038 — Program levels are added in admin, drawn from a fixed theme palette

2026-11-15 · Accepted

- **Decision:** Admins add, reorder (drag, `SortableList`) and delete program levels; the three seeded ones are no
  longer fixed (`levelSlugs` is gone). A new level's slug is derived once from its Indonesian name (`uniqueSlug`, now in
  `lib/slug.ts`), never changes afterwards (it is the `/program#<slug>` anchor and the admin URL) and skips
  `reservedLevelSlugs` (ids the Program page already uses). The color is a `theme` column (`level_theme` enum: `sunny`,
  `teal`, `orange`, `blue`, `green`, `berry`) picked from labelled swatches; migration `0006` backfills the original
  three. `in_age_finder` decides whether the hero age chips list a level: finder levels may not share an age, levels
  outside it (special programs such as a speaking club) may overlap any range. A level any unit offers cannot be
  deleted (`levelInUse`; hide it instead); deleting is hard with the names kept in the audit row. Unit cards, the unit
  list and unit pages name levels from the database instead of a hard-coded map. Programs follow the content matrix
  (`rcudp`) for admin and editor. Public layout adapts to the count: Beranda shows one to four levels in a balanced
  grid and five or more in a `ScrollRail` from `md`; the Program tabs scroll with faded edges; the comparison table
  scrolls with a pinned first column beyond three levels; copy no longer says "three levels".
- **Why:** BEC may add levels or special programs later; the fixed list would have needed a developer each time. A fixed
  palette keeps every level on brand and readable (strong on soft ≥ 4.5:1) without admins choosing raw colors, and an
  immutable slug keeps shared links and anchors working.
- **Alternatives:** Keep three fixed levels (needs a release per program); a free color picker (off-brand, contrast not
  guaranteed); editable slugs (breaks links already shared); soft delete for levels (nothing refers to a deleted level
  once no unit offers it, and the audit row keeps its names).

### ADR-039 — An onboarding unit created from a lead keeps the village slot

2026-11-15 · Accepted

- **Decision:** When a unit is created from a lead in `onboarding`, the lead's slot is released and, in the same
  transaction and under the village lock, a reservation with the unit's `unit_id` (migration `0007`) is held for the
  unit (note = unit code, `lead_id` kept for the trail; refused with `quotaFullHold` when the village is full). The
  slot stays while the unit is onboarding, follows it when its village changes, and is released when it turns active
  (before the quota check, so the unit takes the slot), turns inactive or is deleted. Lead writes only touch
  reservations without a `unit_id`, so editing or deleting a converted lead never frees the unit's slot. Regional Quota
  lists such a reservation as "Unit … (persiapan)". A unit added by hand in `onboarding` still holds nothing.
- **Why:** ADR-030 promised that a slot turns into the unit without a gap, but onboarding units do not count toward the
  quota, and a new unit starts in onboarding: converting a lead freed the village for anyone else while the partner was
  still setting up.
- **Alternatives:** Count every onboarding unit toward the quota (changes the meaning for units added by hand, which
  may be placeholders); force units from a lead to start active (shows them on the site before they are ready); keep
  the reservation on the lead (a later lead edit or delete would free the unit's slot).

### ADR-040 — Program levels group classes; units open all or some of them

2026-11-15 · Accepted

- **Decision:** A program level (Kindy Class, Elementary Level, Secondary Level, …) holds an ordered list of classes
  (`program_classes`: a proper name shared by both locales, a school-year span `grade_from`–`grade_to` on the
  `school_grade` enum `tk`, `sd1`…`sd6`, `smp1`…`smp3`, and an optional focus line per locale in
  `program_class_translations`; migration `0008`). Spans may overlap, inside a level and across levels (Smart Kindy 2 is
  SD 1–3, Smart Kindy 3 in Elementary is SD 1–2): placement also follows ability, which the site says once. Classes are
  edited inside the level form (a sortable list) and saved with the level; a class a unit opened by name cannot be
  removed (`classInUse`). Labels such as "TK – SD kelas 1" are built by `formatGradeSpan()` from the `Grades` messages,
  never typed. A unit offers levels as before (`unit_levels`) plus `all_classes`: every class ticked means the whole
  level, including classes added later; a subset is stored in `unit_classes`; a level with classes needs at least one
  (`resolveLevelOffers()`, `classesRequired`). Public pages: Home cards add the school-year span and class chips; the
  Program hero shows the learning path of every class grouped by level (`LearningPath`), each level section its classes
  as a numbered path (`ClassPath`); the comparison table has a Classes row; unit pages name the classes the unit opens;
  the footer lists levels from the database. The age finder stays per level (recommended ages, no overlap).
- **Why:** BEC teaches named classes inside each level and partners do not always open all of them. Grouping keeps the
  site calm (three choices first, the path second) while showing the full ladder; structured spans keep wording
  identical in both languages; `all_classes` means a new class reaches every unit that opens the whole level.
- **Alternatives:** Classes as levels of their own (seven top-level choices, overlapping ages break the age finder);
  free-text spans (inconsistent and untranslated); storing every opened class only (a new class would reach no unit);
  an age finder per class (spans overlap, so one chip could point at two classes).

### ADR-041 — Kemitraan page content is edited in admin

2026-11-15 · Accepted

- **Decision:** The Kemitraan page follows BEC's real offer (beccourses.com/kemitraan-bec) and its content is admin
  content, while the layout stays in code. Four settings, one per section and each saved by its own panel in
  Halaman Kemitraan (`/admin/halaman-kemitraan`, `update` on `settings`):
  - `partnershipBenefits`: benefits, where `featured` ones are large cards and hero highlights;
  - `partnership`: the starter kit (items grouped as materials, classroom or guides, each with an optional photo)
    plus the starting investment. It replaces the old inclusions list; a stored document in the old shape falls back
    to the code defaults;
  - `partnershipTraining`: the lesson flow, the training formats and a gallery of up to eight captioned photos
    (training sessions, partners in the field; `PhotoGallery`). A document saved with the earlier single `imageId`
    reads as a one-photo gallery;
  - `partnershipSteps`: the procedure, where a step may link to the quota check, the form or WhatsApp.

  Every item has fields shared by both locales (an icon from the fixed `partnershipIcons` set, picked from a visual grid,
  or a custom icon image from the media library that replaces it; photo; group; link) and copy per locale. Custom
  icons are media images (PNG/WebP/JPEG, never SVG, which the library does not accept); `iconImageId` defaults to ""
  so sections saved before custom icons existed still parse. Admin lists use `ItemListField`, which shows Indonesian and English side by side. Photos are media
  ids; `usage.ts` finds them in these settings, so the library will not delete a photo in use, and a missing photo
  falls back to the item's icon. Code defaults (`page-defaults.ts`) carry the real copy without photos; the dev seed
  adds sample photos only when the settings are missing. The procedure merges "submit the form to the admin" into
  "fill in the form", because the form reaches the team online. The quota wording stays general ("one unit per
  village, a second only under certain conditions") until BEC confirms the conditions.

- **Why:** The real partnership offer (no profit sharing, starter kit, training) was missing from the site, and staff
  must be able to keep it current without a release. Settings keep it to one validated document per section with no
  migration; a fixed icon set and layout keep every edit on brand.
- **Alternatives:** Content tables per section (a migration for structured copy that changes rarely, and relational
  ordering for short lists); free-form rich text (breaks the layout and the bilingual pairing); copy in the message
  files (needs a developer for every change).

### ADR-042 — Activities open a detail popup with a gallery

2026-11-15 · Accepted

- **Decision:** An activity card opens a popup (`ActivityExplorer` + `ActivityDetail`, `features/activities/components`)
  instead of linking to the Program page, where the same cards were shown again. The popup shows the card photo and up
  to eight more photos (thumbnails switch the large photo, shown whole), the audience, a schedule line, a description,
  "what children do" (up to six lines), the skills practised (up to six chips) and two actions: "find the nearest
  unit" and a pre-filled WhatsApp message (`WhatsApp.activity`). On a unit's page the message goes to that unit and
  "find the nearest unit" is hidden. Empty details are left out, so an activity saved before this change still opens.
- The open activity lives in the URL (`?kegiatan=<slug>`): cards are real links to it, opening pushes a history entry so
  the back button closes the popup, and a shared link opens it directly (closing then only removes the parameter). The
  parameter is read on the client (`useSyncExternalStore`), so pages stay prerendered.
- Data: `activity_translations` gains `description`, `highlights`, `skills` and `schedule` (defaults empty); photos are
  `activity_photos` + `activity_photo_translations` (caption per locale), written as a whole with the activity
  (migration `0009_activity_details`). Admin edits them in Kegiatan ("Detail kegiatan" with locale tabs, "Galeri popup"
  with `PhotoListField`); photos count as media usage.
- **Why:** Parents wanted more than the card, and a click that lands on the same cards felt broken. A popup keeps them
  on the page they were reading, and the URL makes an activity shareable.
- **Alternatives:** A page per activity (more SEO surface but thin content and another route to maintain); expanding
  the card in place (cramped on phones, no room for photos).

### ADR-043 — Production deployment: one environment, images from CI, Caddy behind Cloudflare

2026-11-15 · Accepted (refines ADR-002)

- **Decision:** One production environment, no separate staging.
  - **Where it runs:** first on `dash.beccourses.com` with indexing off, then on `beccourses.com` at
    launch on the same server and database.
  - **Server:** Sumopod/Tencent Jakarta, 2 vCPU / 2 GB / 40 GB, Ubuntu 24.04, upgradable in place.
  - **Database:** dedicated Sumopod PostgreSQL 17, 1 vCPU / 2 GB, 2 GB storage, no TLS available.
  - **Media:** R2 bucket `bec-production`.
  - **Images:** GitHub Actions builds two images per commit on `main` and pushes them to GHCR: the
    standalone `runner`, and `tools` (source + dependencies for migrations and one-off jobs).
  - **Release:** the deploy key may only run `/srv/bec/deploy.sh`. The script pulls, migrates under an
    advisory lock (`scripts/migrate.ts`, drizzle-orm migrator), starts the app, waits for
    `/api/health` to report the new version, and restarts the previous release if it fails.
  - **Proxy:** Caddy runs in the host network with a Cloudflare Origin Certificate. UFW lets 80/443
    in from Cloudflare only, and the app listens on localhost.
  - **Indexing:** `SITE_INDEXING` (default off) controls `robots.txt`, the `robots` meta tag and the
    `X-Robots-Tag` header. Caddy also adds the header on `dash.`.
  - **Database roles:** `bec_app` runs the app and migrations; the read-only `bec_build` prerenders
    public pages during the image build.

  Runbook: `docs/DEPLOY.md`.

- **Why:** Cheapest setup with no data move at launch: the BEC team fills real content in place.
  Building in CI keeps the 2 GB server free for serving. Prerendering needs the real database at
  build time. A forced-command key limits what a leaked CI secret can do. Migrations before the
  switch, plus a health-gated restart, keep a bad release from replacing a good one.
- **Alternatives:**
  - a separate staging on Sumopod's shared PostgreSQL 16 (version mismatch, extensions likely
    blocked);
  - Coolify (about 0.5–1 GB of RAM for itself);
  - building on the server (`next build` needs most of the RAM);
  - prerendering without the database (empty pages until the cache refreshes);
  - copying deploy files from CI (the deploy key would need write access).
- **Follow-up:**
  - every migration must keep the previous release working (rollback never undoes migrations);
  - releases replace the app container with a few seconds of downtime;
  - test data must be removed before launch (APX-303);
  - backups and monitoring before launch (APX-304);
  - add `sslmode=require` if Sumopod offers TLS.

### ADR-044 — Release from `staging`; CI runs on pull requests only

2026-11-15 · Accepted (amends ADR-043)

- **Decision:**
  - Every merge into `staging` deploys to production. The Deploy workflow runs on `push` to
    `staging`, plus a manual run.
  - CI runs on pull requests (and by hand), not again on the merge.
  - Branch protection on `staging` requires pull requests, the three CI checks and an up-to-date
    branch.
  - In CI, the E2E job no longer waits for the quality job.
  - The Playwright mobile project runs only the specs whose behaviour differs on phones
    (navigation, bottom sheets, swipe rows, table/card switch) plus the accessibility sweep.
- **Why:** With one environment, a second hop `staging` → `main` and a second CI run on the merge
  added about ten minutes per release and tested nothing new. The up-to-date rule makes the merged
  commit the one CI tested. E2E (about 200 s) was the long pole; desktop-identical specs on phones
  doubled it.
- **Alternatives:** keep `main` as the release branch (an extra PR per release); deploy after a CI
  run on the merge commit (slower, same result with an up-to-date branch); drop mobile E2E entirely
  (loses phone-only paths).
- **Follow-up:** `main` stays unused until a separate release gate is wanted after launch; then the
  Deploy trigger moves back to `main`. A spec that gains a phone-only path must be added to the
  mobile project's `testMatch`.

### ADR-045 — Migrations run before the app image is built

2026-11-15 · Accepted (amends ADR-043)

- **Decision:** The Deploy workflow runs four jobs: tools image → migrate on the server
  (`deploy.sh migrate <sha>`) → app image → release (`deploy.sh deploy <sha>`, which migrates again
  as a no-op). `DEPLOY_HOST` is also a repository variable, because a job's `if` cannot see the
  variables of an environment.
- **Why:** The app build prerenders public pages from the production database. With migrations
  after the build, the first deploy failed on an empty database ("relation posts does not
  exist"), and any later migration that adds a table or column used by a public page would fail the
  same way.
- **Alternatives:**
  - prerender without the database (pages empty until their cache refreshes);
  - run migrations from GitHub Actions (CI would need the app role's credentials);
  - build on the server (not enough memory).
- **Follow-up:** The running release meets the new schema before it is replaced, which the
  additive-migration rule already requires. A failed build after a successful migration leaves the
  old release running on the new schema: fix forward.

### ADR-046 — Starter content for production

2026-11-15 · Accepted

- **Decision:** `pnpm db:starter` (`src/db/seed/starter.ts`) loads a one-time starter set into the
  empty production database, from the tools image:
  - program levels and classes, activities and FAQ: the reviewed copy of `src/db/seed/content`,
    with the placeholder photos;
  - three real partner units from the old site's list (beccourses.com/daftar-mitra-bec-course):
    BEC-JB-0002 Tanah Baru, BEC-LA-0101 Sukabumi Indah and BEC-JT-0116 Singorojo, keeping their
    old unit numbers;
  - the head office contact from the old site.

  What the old site lacks is dummy and listed in `src/db/seed/starter/content.ts`: coordinates,
  hours, levels, enrollment and student counts of the units; email, office hours and social
  links. The script shows a dry run without `--confirm`, refuses if any content table already has
  rows, never updates or deletes, and keeps a contact setting already saved in admin.
  Testimonials, blog posts and leads are not included: they must be real. The insert logic is
  shared with the dev seed (`src/db/seed/insert.ts`).

- **Why:** An empty production site cannot be reviewed or shown, and entering three levels with
  their classes, the activities and the FAQ by hand is slow and error-prone. Real units and contact
  from the old site keep the preview credible. The dev seed stays local-only because its units,
  people and testimonials are fictional.
- **Alternatives:** Running the dev seed in production (fictional people and quotes in real
  data); everything by hand in admin (slow); importing all 89 old units (unverified data, and the
  partners must confirm their details first).
- **Follow-up:**
  - public pages are cached for hours, so a manual Deploy run follows the import. The app build
    never comes from the layer cache (`BUILD_ID` = the workflow run), otherwise a rebuild of an
    unchanged commit reuses the old prerender and the new data never shows;
  - the old site links two different head office WhatsApp numbers (0877-8424-1961 on the home
    page, 0877-4824-1961 on Kontak Kami): BEC confirms one in Pengaturan;
  - the BEC team replaces the sample photos and dummy unit details.

### ADR-047 — Search regions by name; the cascade stays as the alternative

2026-11-16 · Accepted

- **Decision:** Visitors can type a region's name instead of walking Provinsi → Kab/Kota → Kecamatan → Desa.
  - **Kemitraan:** "Cari desa/kelurahan" (`RegionSearch`) suggests villages, each with its area and quota badge. The
    `RegionFilter` cascade folds below it (`RegionBrowse`, a native `<details>`), open once a village is chosen.
  - **Cek Unit:** the existing search box also suggests cities, districts and villages. Picking one sets the region
    filter and clears the text; Enter still searches unit names.
  - **Search:** `GET /api/regions/search?q=&levels=&quota=` (rate-limited per IP) runs `searchRegions()`: the trigram
    index on `regions.name`, substring matches plus close spellings (`word_similarity`, so "singorejo" finds Singorojo).
    Ranked by exact name (without "Kabupaten"/"Kota"), then wider areas, prefix and similarity. "kab" is read as
    "kabupaten". Results are cached per normalised query. Village quotas come from one batched query
    (`getVillageQuotas`).
  - **UI:** suggestions follow the WAI-ARIA combobox pattern (`useRegionSuggestions`, `useSuggestionKeys`,
    `RegionSuggestionList`) and both pages share it.
  - **Phones:** the bottom action bar steps aside while a text field has focus, so it never covers the suggestions.
- **Why:** Partners usually know their village but not its Kemendagri path, and four dependent selects meant four
  server round trips and long pickers on phones. Names repeat across Indonesia (four "Tanah Baru"), so a suggestion
  always shows its area. The quota in the result answers the question before the pick. The cascade stays for browsing and
  for visitors without JS.
- **Alternatives:**
  - a GET route instead of Server Actions, because actions run one at a time and cannot be cancelled while typing;
  - "use my location" to find the village, set aside: it needs a paid reverse-geocoding service, and village accuracy
    is poor;
  - a second search box on Cek Unit, set aside: two boxes in one panel confuse.
- **Follow-up:** Searching "village + area" in one string ("tanah baru depok") is not supported yet; the area line
  disambiguates instead.
