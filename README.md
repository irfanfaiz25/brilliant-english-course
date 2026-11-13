# Brilliant English Course (BEC)

Website and admin dashboard for BEC — English courses for children aged 4–15, run through partner units.

## Getting started

Requirements: Node 24+, pnpm 11, Docker.

```bash
cp .env.example .env.local   # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm install
pnpm db:up        # Postgres 17 on localhost:5433
pnpm db:migrate
pnpm db:regions   # Indonesian regions (Kemendagri codes), ~3 s
pnpm db:seed      # sample programs, units, posts… for development
pnpm auth:create-user --email you@example.com --role super_admin   # prints a password once
pnpm dev          # http://localhost:3000 · admin at /admin/masuk
```

All commands are listed in [`AGENTS.md` § 5](./AGENTS.md#5-commands).

## Documentation

- Project guide for developers and AI agents: [`AGENTS.md`](./AGENTS.md) (identical to `CLAUDE.md`)
- Design system and UX guidelines: [`DESIGN.md`](./DESIGN.md)
- Delivery phases: [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- Architecture decisions: [`docs/DECISIONS.md`](./docs/DECISIONS.md)
