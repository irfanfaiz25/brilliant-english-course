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

2026-11-14 · Accepted

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
  slot before the quota check and marks the lead `converted` with its `unit_id`, in the same transaction. Leads are
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

2026-11-14 · Accepted

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
