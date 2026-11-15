#!/usr/bin/env bash
# Starts a release on the server (ADR-043), installed at /srv/bec/deploy.sh.
#
#   deploy.sh deploy <sha>     pull the images, migrate, start the app, wait until healthy
#   deploy.sh rollback         start the previous release again (no migrations)
#   deploy.sh status           show the running release
#
# GitHub Actions reaches it through the `deploy` user's forced-command SSH key, so the command
# arrives in SSH_ORIGINAL_COMMAND and nothing else can be run with that key. If migrations fail,
# the running release is untouched; if the new app is not healthy in time, the previous release
# is started again. Migrations are never rolled back: they are additive (docs/DEPLOY.md).
set -euo pipefail

readonly DIR=/srv/bec
readonly HEALTH_URL=http://127.0.0.1:3000/api/health
readonly HEALTH_WAIT_SECONDS=120
readonly KEEP_RELEASES=3

cd "$DIR"

log() { printf '%s %s\n' "$(date '+%F %T')" "$*"; }
fail() { log "ERROR: $*" >&2; exit 1; }

read -r -a args <<<"${SSH_ORIGINAL_COMMAND:-$*}"
action="${args[0]:-}"
tag="${args[1]:-}"

# One deploy at a time.
exec 9>"$DIR/.deploy.lock"
flock -n 9 || fail "another deploy is running"

current="$(cat "$DIR/current-release" 2>/dev/null || true)"
previous="$(cat "$DIR/previous-release" 2>/dev/null || true)"

compose() { BEC_TAG="$1" docker compose --project-directory "$DIR" "${@:2}"; }

wait_healthy() {
  local want="$1" deadline=$((SECONDS + HEALTH_WAIT_SECONDS)) body
  while ((SECONDS < deadline)); do
    body="$(curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null || true)"
    if [[ "$body" == *'"status":"ok"'* && "$body" == *"\"version\":\"$want\""* ]]; then
      return 0
    fi
    sleep 3
  done
  return 1
}

start_release() {
  compose "$1" up -d --no-deps app
}

prune_images() {
  # Keep the images of the last releases, so a rollback never has to pull.
  local keep
  # releases.log lines: "<date> <time> <sha> [rollback]".
  keep="$(tail -n "$KEEP_RELEASES" "$DIR/releases.log" 2>/dev/null | awk '{print $3}' | sort -u)"
  docker image ls --format '{{.Repository}}:{{.Tag}}' \
    | grep -E '^ghcr\.io/irfanfaiz25/bec(-tools)?:' \
    | while read -r image; do
        grep -qxF "${image##*:}" <<<"$keep" || docker image rm "$image" >/dev/null 2>&1 || true
      done
  docker image prune -f >/dev/null
}

case "$action" in
  deploy)
    [[ "$tag" =~ ^[0-9a-f]{7,40}$ ]] || fail "usage: deploy <git sha>"
    log "Deploying $tag (running: ${current:-none})"
    compose "$tag" --profile tools pull --quiet app tools
    log "Applying migrations"
    compose "$tag" --profile tools run --rm tools pnpm --silent db:migrate:deploy \
      || fail "migrations failed; ${current:-nothing} keeps running"
    log "Starting the app"
    start_release "$tag"
    if ! wait_healthy "$tag"; then
      if [[ -n "$current" ]]; then
        log "Not healthy after ${HEALTH_WAIT_SECONDS}s; starting $current again"
        start_release "$current"
        wait_healthy "$current" || log "WARNING: $current is not healthy either"
      fi
      fail "release $tag did not become healthy"
    fi
    compose "$tag" up -d --no-deps caddy >/dev/null
    if [[ "$current" != "$tag" ]]; then
      if [[ -n "$current" ]]; then echo "$current" >"$DIR/previous-release"; fi
      echo "$tag" >"$DIR/current-release"
    fi
    echo "$(date '+%F %T') $tag" >>"$DIR/releases.log"
    prune_images
    log "Release $tag is live"
    ;;
  rollback)
    [[ -n "$previous" ]] || fail "no previous release recorded"
    log "Rolling back from ${current:-none} to $previous"
    start_release "$previous"
    wait_healthy "$previous" || fail "release $previous did not become healthy"
    echo "$current" >"$DIR/previous-release"
    echo "$previous" >"$DIR/current-release"
    echo "$(date '+%F %T') $previous rollback" >>"$DIR/releases.log"
    log "Release $previous is live"
    ;;
  status)
    echo "current: ${current:-none}"
    echo "previous: ${previous:-none}"
    curl -fsS --max-time 5 "$HEALTH_URL" || echo "health: unreachable"
    echo
    ;;
  *)
    fail "usage: deploy <git sha> | rollback | status"
    ;;
esac
