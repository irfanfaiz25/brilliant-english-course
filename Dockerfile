# syntax=docker/dockerfile:1.7
#
# BEC production image (ADR-043). Two targets:
#   runner — the Next.js standalone server (default target, what the server runs)
#   tools  — the source with all dependencies, for one-off jobs: migrations (every deploy),
#            the region dataset and the first staff account (`docs/DEPLOY.md`)
#
# Public pages are prerendered from the database during `next build`, so the build reads the
# production database through a BuildKit secret (`database_url`); it is never stored in a layer.

ARG NODE_IMAGE=node:24-bookworm-slim

# ---- base: Node + pnpm (version from package.json "packageManager") ----
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_HOME=/corepack \
    NEXT_TELEMETRY_DISABLED=1 \
    HUSKY=0
RUN corepack enable
WORKDIR /app

# ---- deps: every dependency, cached until the lockfile changes ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# pnpm itself is stored in the image, readable by the unprivileged user of the tools target.
RUN corepack install && chmod -R a+rX /corepack
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- tools: source + dependencies for one-off jobs (no build output) ----
FROM deps AS tools
COPY . .
# Dependencies are installed above. Without this, pnpm compares file times before every script,
# finds `package.json` newer than the install (COPY above), and tries to reinstall into the
# read-only /app as the unprivileged user (EACCES).
ENV NODE_ENV=production \
    pnpm_config_verify_deps_before_run=false
USER node
CMD ["pnpm", "db:migrate:deploy"]

# ---- build: the production bundle ----
FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEDIA_URL
ARG SITE_INDEXING=false
ARG APP_VERSION=dev
ENV NODE_ENV=production \
    NEXT_OUTPUT=standalone \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_MEDIA_URL=${NEXT_PUBLIC_MEDIA_URL} \
    SITE_INDEXING=${SITE_INDEXING} \
    APP_VERSION=${APP_VERSION}
# The auth secret only has to pass validation here: nothing is signed during the build.
RUN --mount=type=secret,id=database_url,required=true \
    --mount=type=cache,id=next-cache,target=/app/.next/cache \
    DATABASE_URL="$(cat /run/secrets/database_url)" \
    BETTER_AUTH_SECRET="$(head -c 48 /dev/urandom | base64)" \
    pnpm build

# ---- runner: only what the server needs ----
FROM ${NODE_IMAGE} AS runner
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEDIA_URL
ARG SITE_INDEXING=false
ARG APP_VERSION=dev
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_MEDIA_URL=${NEXT_PUBLIC_MEDIA_URL} \
    SITE_INDEXING=${SITE_INDEXING} \
    APP_VERSION=${APP_VERSION}
WORKDIR /app
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "server.js"]
