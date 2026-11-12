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
