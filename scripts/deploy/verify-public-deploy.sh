#!/usr/bin/env bash
# 验证公网入口的前端版本与后端 ping，作为部署后的外部可用性证明。

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://${SSH_HOST:-39.97.237.248}}"
PUBLIC_VERSION_PATH="${PUBLIC_VERSION_PATH:-/version.json}"
PUBLIC_PING_PATH="${PUBLIC_PING_PATH:-/api/visitor/ping}"
PUBLIC_VERIFY_RETRIES="${PUBLIC_VERIFY_RETRIES:-8}"
PUBLIC_VERIFY_INTERVAL="${PUBLIC_VERIFY_INTERVAL:-3}"
PUBLIC_VERIFY_TIMEOUT="${PUBLIC_VERIFY_TIMEOUT:-10}"
EXPECTED_APP_VERSION="${EXPECTED_APP_VERSION:-}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf '缺少命令: %s\n' "$1" >&2
    exit 1
  fi
}

normalize_base_url() {
  printf '%s' "${1%/}"
}

extract_json_string() {
  local key="$1"
  sed -n "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p" | head -n 1
}

read_expected_version() {
  if [ -n "$EXPECTED_APP_VERSION" ]; then
    printf '%s' "${EXPECTED_APP_VERSION#v}"
    return 0
  fi

  sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$ROOT_DIR/frontend/package.json" | head -n 1
}

require_cmd curl

PUBLIC_BASE_URL="$(normalize_base_url "$PUBLIC_BASE_URL")"
EXPECTED_APP_VERSION="$(read_expected_version)"

if [ -z "$EXPECTED_APP_VERSION" ]; then
  printf '无法读取期望版本，请设置 EXPECTED_APP_VERSION 或检查 frontend/package.json\n' >&2
  exit 1
fi

VERSION_URL="${PUBLIC_BASE_URL}${PUBLIC_VERSION_PATH}"
PING_URL="${PUBLIC_BASE_URL}${PUBLIC_PING_PATH}"

log "验证公网部署: $PUBLIC_BASE_URL (expected v$EXPECTED_APP_VERSION)"

attempt=1
last_version="unknown"
last_ping="unknown"

while [ "$attempt" -le "$PUBLIC_VERIFY_RETRIES" ]; do
  version_body="$(curl -kfsS --max-time "$PUBLIC_VERIFY_TIMEOUT" "${VERSION_URL}?t=$(date +%s)" 2>/dev/null || true)"
  ping_body="$(curl -kfsS --max-time "$PUBLIC_VERIFY_TIMEOUT" "$PING_URL" 2>/dev/null || true)"

  last_version="$(printf '%s' "$version_body" | extract_json_string version)"
  last_ping="$(printf '%s' "$ping_body" | extract_json_string data)"

  if [ "$last_version" = "$EXPECTED_APP_VERSION" ] && [ "$last_ping" = "pong" ]; then
    log "公网验证通过: version=v$last_version, ping=$last_ping"
    exit 0
  fi

  log "公网验证等待: version=${last_version:-ERR}, ping=${last_ping:-ERR} $attempt/$PUBLIC_VERIFY_RETRIES"
  attempt=$((attempt + 1))
  sleep "$PUBLIC_VERIFY_INTERVAL"
done

printf '公网验证失败: expected version=%s, last version=%s, last ping=%s\n' \
  "$EXPECTED_APP_VERSION" "${last_version:-ERR}" "${last_ping:-ERR}" >&2
exit 1
