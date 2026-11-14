# AGENTS.md — Brilliant English Course (BEC)

> Single source of truth for any AI agent or developer working in this repo.
> `AGENTS.md` and `CLAUDE.md` must stay **identical**. Edit one, copy to the other.

## 1. Product

BEC is a network of English courses for children aged 4–15, run through partner-owned
units (franchise-style "Kemitraan"). The project is one Next.js application with:

| Area                         | Audience              | Purpose                                                                          |
| ---------------------------- | --------------------- | -------------------------------------------------------------------------------- |
| Public website (`/`, `/en`)  | Parents               | Learn about programs, find the nearest unit, contact it via WhatsApp             |
| Public website               | Prospective partners  | Understand the partnership, check regional quota, submit an application          |
| Admin dashboard (`/admin`)   | BEC staff             | Manage leads, units, regional quota, programs, blog, testimonials, settings, SEO |
| Partner portal (later phase) | Unit owners ("Mitra") | Manage their own unit only                                                       |

Design reference lives in Penpot (file **BEC**: pages `00 · Design System`, `01 · Website`,
`02 · Dashboard`). It is a **direction, not a pixel spec** — improve UX where it helps.
See `DESIGN.md` for the design system, motion rules and page-level UX decisions.

## 2. Stack

| Concern              | Choice                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Framework            | Next.js (App Router, latest stable) + React + TypeScript (`strict`)                             |
| Styling              | Tailwind CSS v4, tokens defined in `src/styles/globals.css` (`@theme`)                          |
| UI primitives        | shadcn/ui (Radix), copied into `src/components/ui`                                              |
| Motion               | Motion (`motion/react`, via `LazyMotion` + `m`), CSS scroll-driven animations, View Transitions |
| Database             | PostgreSQL 17, Drizzle ORM + drizzle-kit migrations                                             |
| Auth                 | Better Auth (email + password), role-based access                                               |
| i18n                 | next-intl — `id` (default, no prefix) and `en` (`/en/...`)                                      |
| Forms                | React Hook Form + Zod (schemas shared between client and server)                                |
| Tables               | TanStack Table (shadcn data-table pattern)                                                      |
| Rich text            | Tiptap (blog editor), stored as JSON, rendered server-side                                      |
| Media                | Cloudflare R2 (S3 API) + `next/image`                                                           |
| Jobs / notifications | pg-boss (Postgres-backed queue) + a separate worker process                                     |
| Spam protection      | Cloudflare Turnstile + honeypot + per-IP rate limit                                             |
| Tests                | Vitest (unit/integration), Playwright (E2E)                                                     |
| Package manager      | pnpm                                                                                            |
| Hosting              | VPS (app, Docker) + managed PostgreSQL 17, behind Cloudflare                                    |

Do not add a separate backend (Express, Nest, …). Server logic lives in Server Actions,
Route Handlers and the worker. Do not add a new dependency without a reason in the PR
description; prefer what is already in the stack.

## 3. Folder structure

```
.
├── AGENTS.md / CLAUDE.md      # this file (identical copies)
├── DESIGN.md                  # design system + UX/motion guidelines
├── docs/
│   ├── ROADMAP.md             # phases and their definition of done
│   └── DECISIONS.md           # architecture decision log (ADR-style)
├── messages/                  # next-intl dictionaries: id.json, en.json
├── public/                    # static assets; brand files in public/brand (logo .webp + .png fallback)
├── scripts/                   # one-off scripts (build-regions.ts refreshes the region dataset, …)
├── src/
│   ├── app/
│   │   ├── [locale]/(site)/   # public pages (localized)
│   │   ├── [locale]/(dev)/    # internal pages, e.g. /design-system (flag-gated, noindex)
│   │   ├── admin/             # staff area, own root layout (Indonesian, noindex, not localized by URL)
│   │   │   ├── (auth)/        # /admin/masuk, /admin/lupa-password, /admin/reset-password
│   │   │   └── (dashboard)/   # signed-in pages
│   │   ├── api/               # route handlers (webhooks, public JSON); auth has no route (ADR-025)
│   │   ├── sitemap.ts, robots.ts
│   ├── features/<domain>/     # domain modules (see below)
│   ├── config/                # shared constants: navigation, cache tags, limits, enums (value lists)
│   ├── components/
│   │   ├── ui/                # shadcn primitives — no business logic
│   │   ├── site/              # public layout pieces (header, footer, sections)
│   │   ├── admin/             # dashboard layout pieces (sidebar, data-table)
│   │   └── motion/            # Reveal, Stagger, CountUp, etc.
│   ├── db/
│   │   ├── schema/            # one file per domain, re-exported from index.ts
│   │   ├── migrations/        # generated by drizzle-kit — never edit applied ones
│   │   ├── seed/              # dev seed + region dataset (regions/regions.csv + import script)
│   │   └── client.ts
│   ├── i18n/                  # routing, navigation, request config, message types
│   ├── lib/                   # env, auth, permissions, seo, storage, utils
│   ├── worker/                # pg-boss worker entry + job handlers
│   └── styles/globals.css
└── tests/e2e/                 # Playwright specs
```

### Domain modules (`src/features/<domain>/`)

Domains: `regions`, `units`, `quota`, `partners` (leads), `programs`, `activities`,
`blog`, `testimonials`, `faq`, `settings`, `seo`, `media`, `notifications`, `users`.

Each module uses the same files (create only what is needed):

| File          | Contains                                                                    |
| ------------- | --------------------------------------------------------------------------- |
| `schema.ts`   | Zod schemas + inferred types (input validation)                             |
| `queries.ts`  | Read functions (`import "server-only"`), cached and tagged                  |
| `actions.ts`  | Server Actions (`"use server"`): validate → authorize → mutate → revalidate |
| `service.ts`  | Business rules shared by actions, route handlers and worker                 |
| `components/` | UI specific to this domain                                                  |
| `*.test.ts`   | Colocated unit tests                                                        |

Rules:

- Pages and components never import `db` directly — go through `queries.ts` / `service.ts`.
- `features/a` may import from `features/b` only through its public functions, never its internals.
- `components/ui` stays generic; domain UI goes in `features/<domain>/components`.

## 4. Conventions

### TypeScript & code

- `strict: true`, no `any` (use `unknown` + narrowing). No non-null `!` without a comment.
- Server-only modules start with `import "server-only"`.
- Environment variables are read only through `src/lib/env.ts` (server, Zod-validated) and `src/lib/public-env.ts`
  (`NEXT_PUBLIC_*`). Never `process.env.X` elsewhere — ESLint enforces it. Tool configs (`drizzle.config.ts`) are the exception.
- `src/db/client.ts` and `src/lib/env.ts` do **not** import `server-only` because the worker and scripts run them in plain Node.
- Next.js 16 specifics: Cache Components are on (`cacheComponents: true`); request interception lives in `src/proxy.ts`
  (not `middleware.ts`). Check `node_modules/next/dist/docs/` before using an API you are unsure about.
- Naming: files `kebab-case.ts`, components `PascalCase`, functions `camelCase`, DB tables/columns `snake_case`.
- Default to Server Components. Add `"use client"` only for interactivity, as low in the tree as possible.
- Code comments and docs are written in **English**. UI copy lives in `messages/*.json`, never hard-coded.
- No magic values for design: colors, radii, shadows, durations and z-indexes come from tokens in
  `src/styles/globals.css` (JS mirror: `src/lib/design-tokens.ts`). Never a raw hex or arbitrary
  `bg-[#…]` class. A new special color is added once as a variable and reused (`DESIGN.md` § 2, ADR-010).
- Shared constants (routes, cache tags, limits, roles) live in one named module, not repeated literals
  (`src/config/cache-tags.ts`, `src/config/limits.ts`, …).
- UI: compose from `src/components/ui` and merge classes with `cn()` from `@/lib/utils` (token-aware). Add a
  primitive with the shadcn CLI only to get the source, then restyle it with tokens and show it on `/design-system`.
- Interactivity is deliberate: follow `DESIGN.md` § 1.2 before turning static content into a Client Component.
- Page-specific sections are colocated in a private folder next to the page (e.g. `app/[locale]/(site)/_home/`);
  reusable section building blocks (`Section`, `SectionHeader`, `DecorBlob`, `Doodle`, `PageCanvas`) live in `components/site`.
  Wrap a page's sections in `PageCanvas` so backgrounds stay continuous (`DESIGN.md` § 1.1).
  Sections used by more than one page are shared and prop-driven: `FaqSection`, `ClosingCtaSection`, `Breadcrumbs`,
  `SectionTabs`, `UrlStateShell`, `CopyLinkButton`, `PageHero`, `PartnerBanner`, `FactRow` (`components/site`), `ActivitiesSection`, `TestimonialsSection` and `RegionFilter`
  (`features/<domain>/components`). Promote a section the moment a
  second page needs it; don't copy it.
- Public `queries.ts` read Postgres and are cached with `"use cache"` + `cacheTag(cacheTags.x)` from
  `src/config/cache-tags.ts`; cached functions take only serializable arguments (ADR-026). Display region names with
  `shortRegionName()`; pick localized rows with `pickTranslation()` (`src/lib/translations.ts`). Sample content lives in
  `src/db/seed/content` (PLACEHOLDER, used by `pnpm db:seed` and unit tests); code defaults of settings live in
  `features/<domain>/defaults.ts`. Placeholder photos are referenced only through `src/config/placeholder-images.ts`
  (credits in `public/placeholders/CREDITS.md`) and stored as `media_assets` rows by the seed.
- Admin pages render inside the shell (`app/admin/(dashboard)/layout.tsx`); a page provides an `AdminPageHeader` (its
  only `h1` and its `breadcrumbs`: parent modules by nav key, `false` only on Ringkasan) and content, never another `<main>`. Modules are listed once in `src/config/admin-navigation.ts` with the
  resource that guards them; admin data functions live in `features/<domain>/admin-queries.ts`, take the `SessionUser`
  and call `assertCan()` before reading. Admin surfaces use `surface-glass-panel` (`DESIGN.md` § 6). Each form sits in an
  `AdminPanel` (its `h2`, description and `LastSaved` line) and submits with `useSaveForm()` + `FormFooter`
  (`components/admin`): browser validation with the shared schema, the raw values to the action, field errors back
  on their fields, a toast, `router.refresh()`. Error codes are translated by `useFormErrorText()` (`AdminForms.errors`).
  Long content forms add `LocaleTabs` + `useLocaleTabs()`, `StringListField`, `MediaPicker`, a sticky `FormFooter` and
  `UnsavedChangesGuard`; list rows use `VisibilitySwitch`, `ActionIconButton` and `DeleteButton` (`row-actions.tsx`),
  and manually ordered lists `OrderedRowActions` with `moveInOrder()`/`moveSchema` (`lib/ordering.ts`).
  Data lists render a table from `md` and cards below, keep filters in the URL with `listHref()` (chips: `FilterChips`) and page with
  `ListPagination` (`components/admin`); CSV files are built with `toCsv()` (`lib/csv.ts`, formula-safe);
  uploads use `MediaUploader` (`features/media/components`, browser → storage with progress) and files are stored only
  through `storage` (`lib/storage`: R2, or `.storage/` when the `R2_*` variables are unset); image URLs come from `mediaUrl()`; selects use `NativeSelect`, weekdays `WeekdayPicker`, and a
  village is chosen with `RegionPicker` (`features/regions/components`, initial state from `getRegionPickerLevels()`).
  Public cards an admin edits are pure views (`LevelCard`, `ActivityCard`, `UnitCardView`) so forms can preview them.
- Public pages render inside `SiteShell` (`src/app/[locale]/(site)/layout.tsx`); page content starts below the header,
  so a page provides its sections, not another `<main>`. Navigation items live in `src/config/navigation.ts`.
- WhatsApp links are always built with `buildWhatsAppUrl()` (`src/lib/whatsapp.ts`); message templates live in the
  `WhatsApp` message namespace. The head-office number, email, address, office hours and social links come from
  `getContactSettings()` (`features/settings/queries.ts`, admin-editable in Pengaturan), never from `siteConfig`.
- Motion: use the primitives in `src/components/motion` (import each from its own file). For custom animations use
  `m` from `motion/react-m` (LazyMotion is strict) and values from `motion/tokens.ts`; follow `DESIGN.md` § 3.

### Server Actions & API

Every mutation follows: **validate (Zod) → authorize (`can(user, action, resource)`) → mutate in a transaction when touching >1 table → write audit log → `revalidateTag`**.
Admin actions run this pipeline through `guardedAction()` (`features/users/guarded-action.ts`, expires tags with `updateTag`);
the service does the transaction and audit row and throws `ActionFailure` (`lib/action-result.ts`) for rule failures such as
`notFound` or a field error. Build form schemas from `lib/form-schemas.ts` (`textField`, `integerField`, `rowListField`,
`imageIdField`): their messages are codes with limits (`tooLong:120`) that `useFormErrorText()` translates.
Return a typed result `{ ok: true, data } | { ok: false, error }` (`ActionResult` in `src/lib/action-result.ts`); never throw raw errors to the client.
Forms share one Zod schema between React Hook Form and the action; validation messages are codes translated in the UI.

### Authorization

Roles: `super_admin`, `admin`, `editor`, `mitra` (mitra is scoped to its `unit_id`; portal ships in a later phase).
Permissions are defined in one place (`src/lib/permissions.ts`) and checked on the server — hiding UI is not authorization.
A change to the matrix must be mirrored in `permissions.test.ts`, which lists every role × resource × action by hand.

- Better Auth lives in `src/lib/auth.ts`; UI and actions never import it directly but go through `features/users`
  (`actions.ts` for sign-in/out and reset, `session.ts` for the session). There is no `/api/auth` route (ADR-025).
- Read the session with `getCurrentUser()` / `requireUser()` / `requirePermission()` from `features/users/session.ts`,
  inside a component behind `<Suspense>`, never at the top of a layout. Every Server Action re-checks the session itself.
- `src/proxy.ts` only redirects visitors without a session cookie away from `/admin`; it is not authorization.
- Staff accounts are created with `pnpm auth:create-user` (self sign-up is disabled). Admin paths and the admin locale
  live in `src/config/admin-routes.ts`; post-login redirects go through `safeAdminRedirect()`.

### Database

- Schema changes: edit `src/db/schema/*` → `pnpm db:generate` → review the SQL → commit migration with the code.
- Never edit a migration that was already applied anywhere; add a new one.
- Use Postgres 17 locally (Docker) to match production. Extensions `pg_trgm` and `unaccent` are created by migration `0000_enable_extensions`.
- Driver: `pg` (node-postgres), shared by Drizzle and pg-boss.
- Primary keys: `uuid` for app data (`gen_random_uuid()`, v4; switch to `uuidv7()` once the server has it); Kemendagri codes as keys for the `regions` table.
- Every content table has `created_at`, `updated_at` (helpers in `src/db/schema/_helpers.ts`); soft delete (`deleted_at`) for units, posts, leads.
- Localized content uses `<entity>_translations` tables with the composite primary key (`entity_id`, `locale`). Fallback: `en` → `id`.
- Enum value lists (roles, statuses, categories, locales) are defined once in `src/config/enums.ts` and re-exported by the owning `features/<domain>/schema.ts`; `src/db/schema` imports that file relatively because drizzle-kit does not resolve the `@/` alias. Nothing else imports `src/config/enums.ts` directly.
- Regions are reference data (ADR-023): `pnpm db:regions` upserts `src/db/seed/regions/regions.csv` (91,599 Kemendagri codes with official names); `pnpm db:regions:build` refreshes that file from the pinned upstream commit. Never edit regions in admin or by hand.
- Settings are one JSON document per key in `settings`, validated by a Zod schema with code defaults in `features/settings` (no migration for a new setting).
- Quota rules (units per village, "almost full" threshold) are the `quota` setting (`getQuotaRules()`); never read
  `limits.unitsPerVillage` directly. A unit's DB writes live in `features/units/admin-service.ts` because
  `units/service.ts` also runs in the browser.
- Production storage is small (1–2 GB): no binary data in the DB, prune job/audit tables on a schedule.
- Never run migrations or seeds against a production database from a local machine.

### i18n

- Locales: `id` (default, URL without prefix) and `en` (`/en`). Slugs are localized for blog posts and programs.
- No automatic locale detection (no `Accept-Language`, no cookie); visitors switch manually (ADR-012).
- Routing lives in `src/i18n/routing.ts`. Route folders use the **Indonesian** path; `pathnames` maps
  each one to its English URL (e.g. `/kemitraan` → `/en/partnership`). Add new public pages there.
- On the public site, navigate with `Link`, `redirect`, `usePathname`, `useRouter` from `@/i18n/navigation`
  (ESLint blocks `next/link` and those `next/navigation` hooks under `app/[locale]` and `components/site`).
- Server code reads the locale with `next/root-params` (via next-intl). In Server Actions and Route
  Handlers pass it explicitly: `getTranslations({ locale, namespace })`.
- Messages: `messages/id.json` is the reference and is type-checked (`src/i18n/types.d.ts`); a unit test
  fails when `en.json` has different keys or empty strings.
- Only namespaces listed in `src/i18n/client-messages.ts` are sent to the browser. Add a namespace there
  only when a Client Component needs it; otherwise translate in a Server Component and pass strings as props.
- Every public page sets a canonical URL and hreflang alternates with `localizedAlternates()` from `src/lib/seo/alternates.ts`.
- Admin UI is Indonesian, but strings still go through next-intl so it can be localized later.

### SEO

- Metadata is generated per route via `generateMetadata`: admin override → content-derived default → global default.
  Static pages return `pageMetadata(key, locale)` (`features/seo/pages.ts`, which also sets canonical and hreflang);
  other routes merge `applySeoOverride()` (`features/seo/format.ts`) with `getSeoOverride()`. The root layout takes the
  global description from the `seo` setting and `titleTemplate`. Add a new static page to `seoPageKeys` and `seoPages`.
- Technical SEO (sitemap, robots, canonical, hreflang, JSON-LD shape) lives in code, not in the admin.
- JSON-LD: `EducationalOrganization` (site), `LocalBusiness` (unit), `Course` (program), `Article` (post), `FAQPage`, `BreadcrumbList`.
  Render it with `<JsonLd data={…} />` and the builders in `src/lib/seo/json-ld.tsx` (`faqPageJsonLd`, `breadcrumbJsonLd`,
  `courseJsonLd`, `articleJsonLd`, …; escapes `<`); never hand-roll script tags. Use `absoluteUrl()` for URLs inside structured data.

### Dynamic content (admin-editable)

Content is dynamic, **layout is not**: admins edit structured fields (text, images, lists, toggles),
never free-form page layout. Statistics shown on the site (units, cities, students) are computed
from data, not typed in. When adding a new section, ask: does it change often, and does a
non-developer need to change it? If yes → admin field with a sensible default in code.

### Performance & accessibility budgets (public pages, mobile, 4G)

- LCP < 2.5 s, CLS < 0.1, INP < 200 ms; Lighthouse ≥ 90 in all categories.
- First-load JS per public route kept minimal; no client component for static content.
- WCAG 2.2 AA: semantic HTML, visible focus, keyboard reachable, contrast ≥ 4.5:1 for body text, `alt` on images.
- Respect `prefers-reduced-motion` (see `DESIGN.md` § Motion).

## 5. Commands

First run: `cp .env.example .env.local` (set `BETTER_AUTH_SECRET`), then `pnpm i && pnpm db:up && pnpm db:migrate && pnpm db:regions && pnpm db:seed && pnpm dev`.
Create a local super admin with `pnpm auth:create-user --email you@example.com --role super_admin` and sign in at `/admin/masuk`.

| Command                                    | Purpose                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `pnpm dev`                                 | Dev server (Turbopack) on http://localhost:3000                                      |
| `pnpm build` / `pnpm start`                | Production build / run                                                               |
| `pnpm lint` / `pnpm typecheck`             | ESLint (zero warnings) / route typegen + `tsc`                                       |
| `pnpm format` / `pnpm format:check`        | Prettier (with Tailwind class sorting)                                               |
| `pnpm test` / `pnpm test:watch`            | Vitest (`*.test.ts` → node, `*.test.tsx` → jsdom)                                    |
| `pnpm test:e2e`                            | Playwright, desktop + mobile (Pixel 7); reuses a server on `E2E_PORT` (default 3000) |
| `pnpm db:up` / `pnpm db:down`              | Local Postgres 17 in Docker (host port 5433)                                         |
| `pnpm db:generate` / `pnpm db:migrate`     | Drizzle: create migration from schema / apply (local only)                           |
| `pnpm db:studio`                           | Drizzle Studio                                                                       |
| `pnpm db:regions`                          | Upsert the Kemendagri region dataset (~3 s) and print search timings                 |
| `pnpm db:regions:build [commit]`           | Refresh `src/db/seed/regions/*` from upstream `cahyadsn/wilayah`; review the diff    |
| `pnpm auth:create-user --email … --role …` | Create a staff account or, with `--reset-password`, set a new password (local/CI)    |
| `pnpm db:seed [--reset]`                   | Dev sample content (local/CI only); `--reset` replaces seeded content                |
| `pnpm worker`                              | Added in Phase 6                                                                     |

Git hooks (Husky): pre-commit runs lint-staged and checks `AGENTS.md` == `CLAUDE.md`;
commit-msg runs commitlint (Conventional Commits, rejects AI co-author trailers).

CI (`.github/workflows/ci.yml`) on PRs/pushes to `staging` and `main`: quality checks, migrations
applied to a throwaway Postgres 17, production build and E2E (on a throwaway database with regions and the dev seed:
public pages are prerendered from it; the E2E global setup creates the staff accounts, so `pnpm test:e2e` locally needs
the migrated, seeded Docker database).

## 6. Workflow

- Work is delivered **phase by phase** (`docs/ROADMAP.md`). One phase (or sub-phase) = one branch = one PR.
- Branches: `main` (production), `staging` (pre-production). Always pull the latest `staging`,
  then branch from it: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`.
- PRs target `staging`; `staging` → `main` for releases.
- Commits and PRs: **Conventional Commits, in English** (`feat(units): add quota check`).
  Do **not** add AI agents/models as co-authors or contributors, and no `Co-Authored-By` trailers.
- Record any decision that later work must follow in `docs/DECISIONS.md` (next ADR number).

### Definition of done (every PR)

1. `pnpm lint`, `pnpm typecheck`, `pnpm test` pass; `pnpm build` succeeds.
2. New logic has tests (services, permissions, validation); critical flows have an E2E spec.
3. UI checked at 360 px, 768 px and 1440 px, keyboard-only, and with reduced motion.
4. All new strings exist in both `messages/id.json` and `messages/en.json`.
5. Docs updated when behavior, structure or a decision changed.

## 7. Don'ts

- Don't copy the Penpot design pixel-for-pixel when a better pattern exists — but stay within the brand tokens.
- Don't put secrets in code, docs, commits or logs. `.env*` files are git-ignored; `.env.example` lists keys only.
- Don't use scroll-jacking or heavy animation libraries for decorative effects.
- Don't fetch data in client components when a Server Component can do it.
- Don't bypass `permissions.ts`, `env.ts` or the query layer "just for now".

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
