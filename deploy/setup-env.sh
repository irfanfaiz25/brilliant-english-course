#!/usr/bin/env bash
# Writes the server's secrets for BEC (ADR-043), run once by a person, never by CI or an AI:
#
#   sudo /srv/bec/setup-env.sh
#
# - asks for the R2 credentials and the Cloudflare Origin Certificate (pasted, never echoed);
# - generates the database passwords and the auth secret;
# - writes /srv/bec/.env and /srv/bec/certs/origin.{pem,key} (owner deploy, mode 600);
# - prints the two statements that give the database roles their passwords and the value of
#   the GitHub secret BUILD_DATABASE_URL. Copy them, then clear the terminal.
#
# Running it again replaces everything with new passwords (run the printed statements again).
set -euo pipefail

readonly DIR=/srv/bec
readonly OWNER=deploy
readonly DB_HOST=pgsql-ded-dbas-jkt-01.sumobase.my.id
readonly DB_PORT=30034
readonly DB_NAME=bec
readonly SITE_URL=https://dash.beccourses.com
readonly MEDIA_URL=https://media.beccourses.com

[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
[[ -t 0 ]] || { echo "Run it in an interactive terminal." >&2; exit 1; }

if [[ -f "$DIR/.env" ]]; then
  read -r -p "$DIR/.env exists. Replace it and generate new passwords? [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || exit 0
fi

ask() { local value; read -r -p "$1: " value; printf '%s' "$value"; }
ask_secret() { local value; read -r -s -p "$1 (hidden): " value; echo >&2; printf '%s' "$value"; }
# Reads pasted PEM text until its END line.
read_pem() {
  local label="$1" line pem=""
  echo "Paste the $label, then press Enter after the -----END ...----- line:" >&2
  while IFS= read -r -s line; do
    pem+="$line"$'\n'
    [[ "$line" == -----END* ]] && break
  done
  [[ "$pem" == -----BEGIN* ]] || { echo "That does not look like a PEM $label." >&2; exit 1; }
  printf '%s' "$pem"
}
random() { openssl rand -hex 24; }

echo "== Cloudflare R2 (bucket for production media)"
r2_account="$(ask "R2 account ID")"
r2_key_id="$(ask "R2 access key ID")"
r2_secret="$(ask_secret "R2 secret access key")"
r2_bucket="$(ask "R2 bucket [bec-production]")"
r2_bucket="${r2_bucket:-bec-production}"

echo "== Cloudflare Origin Certificate (SSL/TLS > Origin Server)"
cert="$(read_pem "certificate")"
key="$(read_pem "private key")"

app_password="$(random)"
build_password="$(random)"
auth_secret="$(openssl rand -base64 32)"

install -d -m 750 -o "$OWNER" -g "$OWNER" "$DIR/certs"
umask 077
printf '%s' "$cert" >"$DIR/certs/origin.pem"
printf '%s' "$key" >"$DIR/certs/origin.key"
cat >"$DIR/.env" <<ENV
# Written by setup-env.sh on $(date '+%F %T'). Secrets: never copy this file elsewhere.
DATABASE_URL=postgres://bec_app:${app_password}@${DB_HOST}:${DB_PORT}/${DB_NAME}
DATABASE_POOL_MAX=10
BETTER_AUTH_SECRET=${auth_secret}
R2_ACCOUNT_ID=${r2_account}
R2_ACCESS_KEY_ID=${r2_key_id}
R2_SECRET_ACCESS_KEY=${r2_secret}
R2_BUCKET=${r2_bucket}
NEXT_PUBLIC_SITE_URL=${SITE_URL}
NEXT_PUBLIC_MEDIA_URL=${MEDIA_URL}
SITE_INDEXING=false
ENV
chown "$OWNER:$OWNER" "$DIR/.env" "$DIR/certs/origin.pem" "$DIR/certs/origin.key"
chmod 600 "$DIR/.env" "$DIR/certs/origin.pem" "$DIR/certs/origin.key"

openssl x509 -in "$DIR/certs/origin.pem" -noout -subject -enddate -ext subjectAltName 2>/dev/null \
  || echo "WARNING: the certificate could not be read." >&2

cat <<DONE

Written: $DIR/.env and $DIR/certs/ (owner $OWNER, mode 600).

1) In APX › Databases › bec-prod, run (sets the role passwords):

   alter role bec_app password '${app_password}';
   alter role bec_build password '${build_password}';

2) GitHub › Settings › Environments › production › secret BUILD_DATABASE_URL:

   postgres://bec_build:${build_password}@${DB_HOST}:${DB_PORT}/${DB_NAME}

Then clear this terminal (Cmd+K). Nothing above is stored anywhere else.
DONE
