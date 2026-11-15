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
| Variable | `DEPLOY_HOST`           | Server IP                                                               |
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

Still to do once:

1. **Deploy user.** Create `deploy` (group `docker`, no password, no sudo) and make it the owner of
   `/srv/bec`. Its `~/.ssh/authorized_keys` has a single line:
   ```
   command="/srv/bec/deploy.sh",restrict ssh-ed25519 AAAA… github-actions-deploy
   ```
2. **Registry.** As `deploy`: `docker login ghcr.io -u <github user>` with a token that only has
   `read:packages`.
3. **Files.** Copy `deploy/compose.yml`, `deploy/Caddyfile` and `deploy/deploy.sh` to `/srv/bec`
   (`deploy.sh` mode 750). Write `.env` (§ 2).
4. **TLS.** Cloudflare → SSL/TLS → Origin Server → create a certificate for `beccourses.com` and
   `*.beccourses.com` (15 years). Save it as `/srv/bec/certs/origin.pem` and `origin.key` (mode
   600). Set SSL/TLS mode to **Full (strict)** and turn on Always Use HTTPS.
5. **DNS.** `dash` → A record to the server IP, **proxied**. `media` → the R2 bucket's custom domain.
6. **R2 CORS** on `bec-production` (browser uploads use presigned URLs): allow `PUT` and `GET` from
   `https://dash.beccourses.com` (add `https://beccourses.com` at launch), header `Content-Type`.

When `deploy/` changes in the repo, an admin copies the changed files to `/srv/bec`. The deploy
key can only start `deploy.sh`, never replace it.

## 4. Database

The Sumopod admin user creates the database and two roles once:

```sql
-- As the Sumopod admin user, on the "postgres" database:
create role bec_app login password '<long random>';
create role bec_build login password '<long random>';
create database bec owner bec_app;

-- Then on the "bec" database, as bec_app (the owner):
grant connect on database bec to bec_build;
grant usage on schema public to bec_build;
alter default privileges in schema public grant select on tables to bec_build;
```

- `bec_app` runs the app and the migrations. It owns the database, so it can create the trusted
  extensions `pg_trgm` and `unaccent` (checked on a non-superuser role).
- `bec_build` can only read. The image build uses it to prerender public pages.
- The connection has no TLS (Sumopod does not offer it). Logins use SCRAM, and both roles have the
  least rights they need. If TLS becomes available, add `?sslmode=require` to both URLs.

## 5. Releasing

1. Merge a pull request into `staging`. Its CI already passed (branch protection, § 5.1). **Deploy**
   builds both images and calls `deploy.sh deploy <sha>` on the server; it is not tested again.
2. `deploy.sh`:
   1. pulls the images;
   2. runs the migrations from the tools image under an advisory lock (if they fail, the running
      release stays);
   3. starts the new app;
   4. waits up to 120 s for `/api/health` to report the new version.

   If the new release is not healthy, it starts the previous one again and the workflow fails.

3. The workflow then checks the public URL serves the new version.

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

Run on the server in `/srv/bec`, with the tag of the running release:

```bash
cd /srv/bec && export BEC_TAG="$(cat current-release)"
docker compose --profile tools run --rm tools pnpm db:regions               # region dataset (first deploy)
docker compose --profile tools run --rm tools pnpm auth:create-user \
  --email you@example.com --name "Name" --role super_admin                  # first super admin
```

Never run `pnpm db:seed` in production: it refuses to, and sample content must not reach real
data. The first super admin creates everyone else in Pengguna.

## 7. First deploy

1. Database roles (§ 4) and `.env` (§ 2).
2. Run the Deploy workflow by hand. It applies every migration on the empty database.
3. `pnpm db:regions` and `pnpm auth:create-user` (§ 6).
4. Smoke test:
   - public pages and `/admin/masuk`;
   - upload a photo (R2);
   - send a test partner application (delete it before launch);
   - `curl -sI https://dash.beccourses.com | grep -i x-robots` → `noindex`;
   - `/robots.txt` → `Disallow: /`.
5. The BEC team fills in the real content in admin.

## 8. Launch on beccourses.com

Tracked in tasks APX-301 (noindex), APX-302 (redirects), APX-303 (launch checklist).

1. Real content complete. Test data deleted: test leads, units and photos.
2. Full backup of the old WordPress site.
3. GitHub variables: `NEXT_PUBLIC_SITE_URL=https://beccourses.com`, `SITE_INDEXING=true`. Same in
   `/srv/bec/.env`.
4. Caddyfile: switch to the launch blocks at the end of `deploy/Caddyfile`, plus the 301 redirects
   from the old WordPress URLs.
5. R2 CORS: add `https://beccourses.com`.
6. DNS: `beccourses.com` and `www` → server IP (proxied).
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
