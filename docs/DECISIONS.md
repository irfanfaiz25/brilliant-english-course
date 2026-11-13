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
