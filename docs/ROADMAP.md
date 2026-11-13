# Roadmap

Delivery is phased. Each phase is one or more branches from `staging`, merged by PR after its
definition of done (see `AGENTS.md` § 6) and the phase-specific checks below.

Status legend: ⬜ not started · 🟨 in progress · ✅ done

| #   | Phase                                      | Status     |
| --- | ------------------------------------------ | ---------- |
| 0   | Foundation docs                            | ✅         |
| 1   | Scaffold & tooling                         | ✅         |
| 2   | Design system in code & site shell         | ✅         |
| 3   | Data model, regions & auth                 | ✅         |
| 4   | Admin modules                              | ⬜         |
| 5   | Public website                             | ✅         |
| 6   | Notifications                              | ⬜         |
| 7   | SEO, performance & accessibility hardening | ⬜         |
| 8   | Deployment & operations                    | ⬜         |
| 9   | Partner (Mitra) portal                     | ⬜ (later) |

---

## Phase 0 — Foundation docs

`AGENTS.md` / `CLAUDE.md`, `DESIGN.md`, this roadmap, `docs/DECISIONS.md`, git repo with `main` and `staging`.

## Phase 1 — Scaffold & tooling

- Next.js (App Router, TS strict, `src/`), pnpm, path alias `@/*`.
- ESLint (flat config) + Prettier (+ Tailwind class sorting), Husky + lint-staged + commitlint (conventional).
- `src/lib/env.ts` (Zod) and `.env.example`.
- Docker Compose: PostgreSQL 17 with `pg_trgm`, `unaccent`. Drizzle config + empty schema + first migration.
- Vitest + Testing Library, Playwright with one smoke test.
- GitHub Actions CI: install → lint → typecheck → test → build on PRs to `staging`/`main`.
- **Done when:** fresh clone → `pnpm i && pnpm db:up && pnpm dev` works; CI green.

## Phase 2 — Design system in code & site shell

Delivered as four PRs: **2a** i18n & routing ✅ · **2b** UI primitives + `/design-system` ✅ · **2c** motion primitives ✅ · **2d** site shell ✅.

- Tailwind `@theme` tokens and Poppins were set up early in Phase 1; this phase adds shadcn/ui init and restyle.
- Primitives: Button, Badge, Input, Select/Combobox, Card, Accordion, Sheet, Dialog, Toast.
- Motion primitives: `Reveal`, `Stagger`, `CountUp`, reduced-motion handling.
- next-intl routing (`id` default, `/en`), locale switcher, `messages/id.json` + `en.json`.
- Public layout: Navbar (desktop + mobile sheet), footer, sticky mobile action bar, 404.
- Internal `/design-system` preview page (dev only) showing tokens and components.
- **Done when:** components pass keyboard + contrast checks; layout works at 360–1440 px.

## Phase 3 — Data model, regions & auth

Sub-phases: **3a** schema & regions ✅ · **3b** auth & permissions ✅ · **3c** admin shell, seed & fixture swap ✅.

- Drizzle schema for all domains (incl. `_translations` tables, audit log, settings). ✅ 3a: 23 tables in
  `src/db/schema` (migration `0001_domain_schema`), value lists shared with Zod via `src/config/enums.ts` (ADR-024).
- Region import script (Kemendagri codes: province → regency → district → village) + trigram indexes. ✅ 3a:
  `pnpm db:regions` upserts the checked-in dataset (ADR-023) — 38 provinces, 514 regencies, 7,285 districts,
  83,762 villages (91,599 rows, matching upstream's published totals) in ~3 s; CI runs it on a fresh database. Name search (`ILIKE` on the trigram
  index) and the children query take 1–3 ms locally.
- Better Auth: login, logout, reset password; roles `super_admin`, `admin`, `editor`, `mitra` (scoped, inactive UI). ✅ 3b
  (ADR-025): Server Actions only (no `/api/auth`), staff created with `pnpm auth:create-user`, sign-in at `/admin/masuk`,
  failed sign-ins rate-limited, hashed reset tokens, inactive accounts blocked. Reset emails are logged locally until Phase 6.
- `permissions.ts` with unit tests ✅ 3b (every role × resource × action, unit scoping, inactive accounts); admin shell (sidebar, top bar, protected routes) ✅ 3c (ADR-026):
  frosted sidebar and top bar, menu filtered by permission, Ringkasan with KPIs and latest leads, one guarded
  placeholder per Phase 4 module, admin 404.
- Dev seed: sample units, programs, posts, testimonials; public `queries.ts` switch from fixtures to the
  database with no visual change, and CI's build/E2E job gets a database. ✅ 3c (ADR-026): `pnpm db:seed` loads the
  Phase 5 sample content (units on real Kemendagri villages) plus sample leads; every public query reads Postgres;
  partner applications are stored with an audit row; CI seeds a throwaway database before the build.
- **Done when:** permission matrix fully tested (✅ 3b); region search returns in < 100 ms locally (✅ measured in 3a).

## Phase 4 — Admin modules

Sub-phases (separate PRs): 4a Settings & SEO defaults · 4b Programs & Activities · 4c Units & Quota ·
4d Leads (Calon Mitra) pipeline · 4e Blog (Tiptap) & Media (R2) · 4f Testimonials & FAQ · 4g Users & roles · 4h Ringkasan (overview).

- **Done when:** each module has CRUD, validation, authorization, audit log, revalidation, and an E2E happy path.

## Phase 5 — Public website

Built UI-first with typed fixtures behind `features/<domain>/queries.ts` (ADR-016); Phases 3–4 swap the fixtures for the database without touching components.

Sub-phases: 5a Beranda ✅ (5a-1 hero, stats, programs, activities · 5a-2 unit finder, steps, partnership, testimonials, FAQ, closing CTA) · 5b Program ✅ · 5c Cek Unit ✅ (5c-1 finder · 5c-2 unit/area SEO pages) · 5d Kemitraan + partner form ✅ (leads stored from Phase 3/4d) · 5e Blog + detail ✅ · 5f Kontak ✅.

- All content from the DB/settings, both locales, motion per `DESIGN.md` § 3.
- **Done when:** Lighthouse mobile ≥ 90 on every page; journeys in `DESIGN.md` § 5.1 pass as E2E tests.
- **Closed 2026-11-13:** Lighthouse mobile (Moto G Power profile, applied throttling, production build) on all 14
  page templates: performance 97–100, accessibility 96–97, best practices 100, SEO 100; LCP 1.5–2.4 s, CLS 0.
  Remaining accessibility deduction = the accepted brand contrast on orange/WhatsApp fills (ADR-010).
  `tests/e2e/accessibility.spec.ts` checks keyboard focus and reduced motion on every template (ADR-022).
  Re-measure with PageSpeed Insights on staging once deployed (Phase 8): simulated throttling on localhost
  over-estimates LCP because every script finishes before the first paint.

## Phase 6 — Notifications

- pg-boss queue + worker process; channels: email, Telegram, WhatsApp (provider decided in this phase).
- Templates per event (new lead → owner + applicant), toggled and edited in admin settings; retry + failure log.
- **Done when:** a submitted lead triggers configured channels; failures are visible in admin.

## Phase 7 — SEO, performance & accessibility hardening

- Sitemap (localized, with region/unit pages), robots, JSON-LD validation, OG images, hreflang audit.
- Analytics events (WhatsApp clicks, form submits), Search Console verification.
- Axe audit in Playwright, bundle analysis, image audit.

## Phase 8 — Deployment & operations

- Multi-stage Dockerfile (standalone output), image built in GitHub Actions → GHCR.
- VPS (2 vCPU / 2 GB, swap 2 GB): app + worker containers behind Caddy/Coolify; Cloudflare DNS/CDN/SSL.
- Managed PostgreSQL 17 (Sumopod, same region); migrations applied by the deploy pipeline after review.
- Backups (provider + weekly logical dump to R2), uptime monitoring, error tracking.
- `staging` and `production` environments.

## Phase 9 — Partner (Mitra) portal _(later)_

- Mitra login scoped to own unit: profile, schedule, photos, own leads/testimonials.
