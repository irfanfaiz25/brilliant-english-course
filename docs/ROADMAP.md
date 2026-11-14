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
- 4a Settings & SEO defaults ✅ (ADR-027): Pengaturan edits the head-office contact (WhatsApp, email, address, office
  hours, social links) and the partnership package (investment, inclusions per locale); every public WhatsApp button,
  the header, footer and Kontak read it. SEO edits the site-wide default description and the title/description of the
  7 static pages per locale, with a search-result preview; `noindex` is super-admin only. Every save validates with
  the shared schema, checks the permission, writes an audit row in the same transaction and expires the cache tag.
- 4b Programs & Activities ✅ (ADR-028): Program lists the three fixed levels (show/hide switch, edit page with class
  details, photo from the media library, bilingual copy incl. card highlights and curriculum lists; overlapping age
  ranges are refused). Kegiatan adds, edits, hides, reorders (drag, since 4f) and deletes activities (confirm dialog). Long
  forms use `ID | EN` tabs with an error dot, a sticky save bar once dirty and an unsaved-changes guard.
- 4c Units & Quota ✅ (ADR-029): Unit Mitra lists units with search, status chips with counts and paging (table from
  `md`, cards on phones); add/edit with a province → village picker, coordinates with a map check, schedule, levels
  and a live preview of the public unit card; soft delete. Codes are generated per province (`BEC-JB-0124`), slugs are
  unique per regency, and activating a unit in a full village is refused. Kuota Wilayah edits the quota rules (now a
  setting read by Kemitraan), checks one village, lists occupied villages and creates/releases reservations.
- 4d Leads pipeline ✅ (ADR-030): Calon Mitra lists applications with search (name, reference, WhatsApp), status
  chips with counts, "Sedang diproses" and "Ditugaskan ke saya" filters, paging and a CSV export of the filtered list.
  The detail page shows the application, a WhatsApp chat button, status/assignee/note in one form, the village quota
  and one history of notes and changes. Persiapan holds a village slot; "Buat unit" prefills the unit form and turns
  the lead into a partner when the unit is saved.
- 4e-1 Media ✅ (ADR-031): Media lists every image with search, a "Belum dipakai" filter and paging; uploads go
  straight from the browser to storage (R2, or `.storage/` without R2) with live progress, then become WebP of at
  most 2400 px. An image page shows the preview, details, its name, where it is used and delete (refused while in
  use). The image picker of content forms can upload too.
- 4e-2 Blog ✅ (ADR-032): Blog lists articles with live search, status chips with counts and paging; the write/edit
  page has a full Tiptap editor (headings, marks, brand colors, alignment, lists, quote, code, tables, images with
  captions, YouTube, HTML import, word count), `ID | EN` tabs with optional English, cover image, category, author,
  status and publish time. Admin list searches now apply while typing.
- 4f Testimonials & FAQ ✅ (ADR-033): Testimoni and FAQ list each group (parents/partners; parents/program/partners)
  behind filter chips with counts; rows can be shown or hidden, dragged into order (mouse, touch or keyboard; also the list fields of content forms), edited and deleted. Testimonials have a
  name, a star rating and a bilingual quote and context line with a live card preview; FAQ entries a bilingual
  question and plain-text answer (line breaks kept on the site).

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
