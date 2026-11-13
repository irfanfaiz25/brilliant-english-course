# Roadmap

Delivery is phased. Each phase is one or more branches from `staging`, merged by PR after its
definition of done (see `AGENTS.md` § 6) and the phase-specific checks below.

Status legend: ⬜ not started · 🟨 in progress · ✅ done

| #   | Phase                                      | Status     |
| --- | ------------------------------------------ | ---------- |
| 0   | Foundation docs                            | ✅         |
| 1   | Scaffold & tooling                         | ✅         |
| 2   | Design system in code & site shell         | ✅         |
| 3   | Data model, regions & auth                 | ⬜         |
| 4   | Admin modules                              | ⬜         |
| 5   | Public website                             | ⬜         |
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

- Drizzle schema for all domains (incl. `_translations` tables, audit log, settings).
- Region import script (Kemendagri codes: province → regency → district → village) + trigram indexes.
- Better Auth: login, logout, reset password; roles `super_admin`, `admin`, `editor`, `mitra` (scoped, inactive UI).
- `permissions.ts` with unit tests; admin shell (sidebar, top bar, protected routes).
- Dev seed: sample units, programs, posts, testimonials.
- **Done when:** permission matrix fully tested; region search returns in < 100 ms locally.

## Phase 4 — Admin modules

Sub-phases (separate PRs): 4a Settings & SEO defaults · 4b Programs & Activities · 4c Units & Quota ·
4d Leads (Calon Mitra) pipeline · 4e Blog (Tiptap) & Media (R2) · 4f Testimonials & FAQ · 4g Users & roles · 4h Ringkasan (overview).

- **Done when:** each module has CRUD, validation, authorization, audit log, revalidation, and an E2E happy path.

## Phase 5 — Public website

Built UI-first with typed fixtures behind `features/<domain>/queries.ts` (ADR-016); Phases 3–4 swap the fixtures for the database without touching components.

Sub-phases: 5a Beranda ✅ (5a-1 hero, stats, programs, activities · 5a-2 unit finder, steps, partnership, testimonials, FAQ, closing CTA) · 5b Program ✅ · 5c Cek Unit ✅ (5c-1 finder · 5c-2 unit/area SEO pages) · 5d Kemitraan + partner form ✅ (leads stored from Phase 3/4d) · 5e Blog + detail ✅ · 5f Kontak.

- All content from the DB/settings, both locales, motion per `DESIGN.md` § 3.
- **Done when:** Lighthouse mobile ≥ 90 on every page; journeys in `DESIGN.md` § 5.1 pass as E2E tests.

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
