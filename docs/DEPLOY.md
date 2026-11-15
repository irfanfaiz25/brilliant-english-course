# Deployment runbook

How BEC runs in production and how to release, roll back and operate it (ADR-043).

## 1. Overview

```
Visitor ──► Cloudflare (DNS proxied, SSL Full (strict), cache)
               │ only Cloudflare IPs may reach 80/443 (UFW)
               ▼
        VPS "BEC Production" (Ubuntu 24.04, Docker) — /srv/bec
        ├─ caddy   host network, :80/:443, Cloudflare Origin Certificate
        ├─ app     ghcr.io/irfanfaiz25/bec:<sha>         127.0.0.1:3000
        └─ tools   ghcr.io/irfanfaiz25/bec-tools:<sha>   one-off jobs (migrations, …)
               │
               ▼
        Sumopod PostgreSQL 17 (dedicated, Jakarta)     Cloudflare R2: bec-production
```

- There is **one environment: production** (decision log, 2026-11-15). Until launch it runs on
  `dash.beccourses.com` with indexing off; at launch `beccourses.com` points to the same server.
- Images are built in GitHub Actions, never on the server. A release is identified by the
  first 12 characters of its git SHA; `/api/health` reports it as `version`.
- Every pull request merged into `staging` is released (ADR-044). CI runs on the pull request, and
  branch protection requires it to pass and be up to date before the merge.

## 2. Configuration

### Server: `/srv/bec/.env` (owner `deploy`, mode 600)

| Key                                                                      | Value                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `DATABASE_URL`                                                           | `postgres://bec_app:…@<host>:<port>/bec` (app role, see § 4)                   |
| `DATABASE_POOL_MAX`                                                      | `10` (the server allows 100 connections)                                       |
| `BETTER_AUTH_SECRET`                                                     | `openssl rand -base64 32`, production only. Changing it signs everyone out.    |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Bucket `bec-production`, token "Object Read & Write" for that bucket only      |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MEDIA_URL`, `SITE_INDEXING`         | Same values as the GitHub variables below (they are also baked into the image) |

### GitHub: environment `production`

| Kind     | Name                    | Value                                                                   |
| -------- | ----------------------- | ----------------------------------------------------------------------- |
| Secret   | `BUILD_DATABASE_URL`    | `postgres://bec_build:…@<host>:<port>/bec` (read-only role, see § 4)    |
| Secret   | `DEPLOY_SSH_KEY`        | Private key whose public half is the `deploy` user's forced-command key |
| Secret   | `DEPLOY_KNOWN_HOSTS`    | `ssh-keyscan -t ed25519 <server ip>` output                             |
| Variable | `DEPLOY_HOST`           | Server IP. Also a **repository** variable: it switches Deploy on        |
| Variable | `NEXT_PUBLIC_SITE_URL`  | `https://dash.beccourses.com` (at launch: `https://beccourses.com`)     |
| Variable | `NEXT_PUBLIC_MEDIA_URL` | `https://media.beccourses.com`                                          |
| Variable | `SITE_INDEXING`         | `false` (at launch: `true`)                                             |

Optional: required reviewers on the `production` environment add an approval step before
every release.

`NEXT_PUBLIC_*` and `SITE_INDEXING` are read at build time (client bundle, prerendered pages,
robots.txt), so changing them needs a new build: run the Deploy workflow by hand.

## 3. Server setup

Done on 2026-11-15 (task APX-300): key-only SSH (`/etc/ssh/sshd_config.d/00-hardening.conf`),
fail2ban, unattended security updates, Docker with log rotation, UFW (22 rate-limited, 80/443
from Cloudflare only via `/usr/local/sbin/bec-cloudflare-ufw` and a weekly timer), swap 2 GB,
timezone Asia/Jakarta.

Docker-published ports bypass UFW. That is why Caddy runs in the host network and the app
listens on `127.0.0.1` only. Never publish another port on `0.0.0.0`.

One-time setup (2026-11-15):

1. **Deploy user.** `deploy` (group `docker`, no password, no sudo) owns `/srv/bec`. Its
   `~/.ssh/authorized_keys` has a single line:
   ```
   command="/srv/bec/deploy.sh",restrict ssh-ed25519 AAAA… github-actions-deploy
   ```
2. **Registry.** The images on GHCR are **public**, like the repository, so the server pulls them
   without a token. They hold no secrets: the build reads the database through a BuildKit secret,
   and `.env` files are excluded from the context. After the first build, set both packages
   (`bec`, `bec-tools`) to Public under the user's GitHub packages, Package settings.
3. **Files.** `deploy/compose.yml`, `deploy/Caddyfile`, `deploy/deploy.sh` and
   `deploy/setup-env.sh` are copied to `/srv/bec` from the repository at a reviewed commit.
4. **Secrets.** A person runs `sudo /srv/bec/setup-env.sh` in their own terminal. It:
   - asks for the R2 credentials and the Origin Certificate;
   - generates the database passwords and the auth secret;
   - writes `.env` and `certs/` (mode 600);
   - prints the two `alter role … password` statements to run on the database, and the
     `BUILD_DATABASE_URL` secret for GitHub.

   No AI or CI sees these values.

5. **TLS.** A Cloudflare Origin Certificate for `beccourses.com` and `dash.beccourses.com` sits in
   `/srv/bec/certs/`. SSL mode **Full (strict)** is set with a Cloudflare **Configuration Rule**
   for `dash.beccourses.com` only (Rules → Configuration Rules), not zone-wide, so other subdomains
   keep their current mode. At launch, the rule extends to `beccourses.com`.
6. **DNS.** `dash` → A record to the server IP, **proxied**. `media` → the R2 bucket's custom domain.
7. **R2 CORS** on `bec-production` (browser uploads use presigned URLs): allow `PUT` and `GET` from
   `https://dash.beccourses.com` (add `https://beccourses.com` at launch), header `Content-Type`.

When `deploy/` changes in the repo, an admin copies the changed files to `/srv/bec`. The deploy
key can only start `deploy.sh`, never replace it.

## 4. Database

Created on 2026-11-15 through APX (approved statements), without passwords. `setup-env.sh` (§ 3)
generates the passwords and prints the statements that set them.

```sql
-- As the Sumopod admin user, on the "postgres" database:
create role bec_app login;
create role bec_build login;
grant bec_app to current_user;              -- lets the admin act as the owner below
create database bec owner bec_app;

-- Then on the "bec" database:
revoke all on database bec from public;
grant connect on database bec to bec_build;
set role bec_app;
grant usage on schema public to bec_build;
alter default privileges in schema public grant select on tables to bec_build;
reset role;
```

- `bec_app` runs the app and the migrations. It owns the database, so it can create the trusted
  extensions `pg_trgm` and `unaccent` (checked on a non-superuser role).
- `bec_build` can only read. The image build uses it to prerender public pages.
- The connection has no TLS (Sumopod does not offer it). Logins use SCRAM, and both roles have the
  least rights they need. If TLS becomes available, add `?sslmode=require` to both URLs.

## 5. Releasing

1. Merge a pull request into `staging`. Its CI already passed (branch protection, § 5.1), so it is not
   tested again. **Deploy** runs four jobs in order (ADR-045):
   1. **Tools image**: build and push `bec-tools:<sha>`.
   2. **Migrate**: `deploy.sh migrate <sha>` applies the migrations on the server, under an
      advisory lock. If they fail, nothing else runs and the current release stays.
   3. **App image**: build `bec:<sha>`, prerendering public pages from the now up-to-date database
      (read-only role), and push it.
   4. **Release**: `deploy.sh deploy <sha>` pulls the app, runs migrations again (a no-op, so a
      manual deploy is always complete), starts the app and waits up to 120 s for `/api/health` to
      report the new version. If it is not healthy, the previous release starts again and the
      workflow fails.
2. The workflow then checks that the public URL serves the new version.

Between steps 2 and 4 the running release works against the new schema. That is why migrations must
be additive (§ Rollback).

Manual release of a commit on `staging`, e.g. to rebuild after changing a GitHub variable: Actions →
Deploy → Run workflow (optional `ref`). Deploys queue: one runs at a time.

Downtime per release is a few seconds while the app container is replaced.

### 5.1 Branch protection on `staging`

Set on GitHub (Settings → Branches), required for releasing straight from `staging`:

- changes only through pull requests (no direct pushes);
- required checks: "Lint, typecheck, unit tests", "Migrations apply on a fresh database" and "Build
  and E2E";
- branches must be up to date before merging, so the tested combination is what deploys;
- admins can bypass in an emergency (use a manual Deploy run afterwards).

`main` is not used for releases yet. If a separate release gate is needed after launch, point the
Deploy trigger back to `main` (ADR-044).

### Rollback

```bash
ssh ubuntu@<server> 'sudo -u deploy /srv/bec/deploy.sh rollback'
sudo -u deploy /srv/bec/deploy.sh status    # on the server
```

Rollback starts the previous image only. **Migrations are never rolled back**, so every migration
must keep the previous release working (add columns or tables; drop or rename only in a later
release, once no running code uses them).

## 6. One-off jobs

Run on the server as `deploy` (it owns `/srv/bec`), with the tag of the running release:

```bash
sudo -u deploy bash -c 'cd /srv/bec && BEC_TAG=$(cat current-release) \
  docker compose --profile tools run --rm tools pnpm --silent <command>'
```

| `<command>`                                                                 | When                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `db:regions`                                                                | First deploy, and after the region dataset changes            |
| `db:starter` / `db:starter --confirm`                                       | Once, into the empty database: starter content (ADR-046)      |
| `auth:create-user --email you@example.com --name "Name" --role super_admin` | First super admin only; it prints a password, run it yourself |

Public pages are cached for hours, so data written outside admin (`db:starter`) appears after the
next build: run the Deploy workflow by hand afterwards.

Never run `pnpm db:seed` in production: it refuses to, and its sample content must not reach real
data. The first super admin creates everyone else in Pengguna.

## 7. First deploy

1. Database roles (§ 4) and `.env` (§ 2).
2. Run the Deploy workflow by hand. It applies every migration on the empty database.
3. `db:regions`, then `db:starter --confirm`, then a manual Deploy run so the pages show it (§ 6).
   The owner runs `auth:create-user` for the first super admin.
4. Smoke test:
   - public pages and `/admin/masuk`;
   - upload a photo (R2);
   - send a test partner application (delete it before launch);
   - `curl -sI https://dash.beccourses.com | grep -i x-robots` → `noindex`;
   - `/robots.txt` → `Disallow: /`.
5. The BEC team checks the starter content (dummy parts are listed in
   `src/db/seed/starter/content.ts`), replaces the sample photos and adds the rest in admin.

## 8. Launch on beccourses.com

Tracked in tasks APX-301 (noindex), APX-302 (redirects), APX-303 (launch checklist).

1. Real content complete. Test data deleted: test leads, units and photos.
2. Full backup of the old WordPress site.
3. GitHub variables: `NEXT_PUBLIC_SITE_URL=https://beccourses.com`, `SITE_INDEXING=true`. Same in
   `/srv/bec/.env`.
4. Caddyfile: switch to the launch blocks at the end of `deploy/Caddyfile`, plus the 301 redirects
   from the old WordPress URLs.
5. R2 CORS: add `https://beccourses.com`.
6. DNS: `beccourses.com` → server IP (proxied). Cloudflare: extend the Full (strict) Configuration Rule
   to `beccourses.com`, and add a Redirect Rule `www.beccourses.com/*` → `https://beccourses.com/$1` (301).
7. Run the Deploy workflow (new build with the new URL), then reload Caddy:
   `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`.
8. Check:
   - canonical URLs, `robots.txt` and the absence of `X-Robots-Tag` on `beccourses.com`;
   - `dash.` and `www.` redirect to the main domain;
   - sign in works.
9. Search Console: verify the domain. Watch 404s in the Caddy logs for two weeks.

## 9. Troubleshooting

| Symptom                          | Look at                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Deploy failed at migrations      | Workflow log. The old release is still running; fix the migration and release again.              |
| New release not healthy          | `docker compose logs --tail 200 app` (with `BEC_TAG` set). The previous release was restarted.    |
| 502 from Cloudflare              | `docker compose ps`, `curl 127.0.0.1:3000/api/health`, `docker compose logs caddy`                |
| 521/522 from Cloudflare          | UFW rules (`sudo ufw status`), the Cloudflare timer (`systemctl status bec-cloudflare-ufw.timer`) |
| Health says database unreachable | Sumopod status, `DATABASE_URL`, connection count                                                  |
