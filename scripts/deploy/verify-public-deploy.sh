#!/usr/bin/env bash
# 验证公网入口的前端版本与后端 ping，作为部署后的外部可用性证明。

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEFAULT_PUBLIC_BASE_URL="${DEFAULT_PUBLIC_BASE_URL:-https://jsonutils.markz.fun}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-$DEFAULT_PUBLIC_BASE_URL}"
PUBLIC_VERSION_PATH="${PUBLIC_VERSION_PATH:-/version.json}"
PUBLIC_HEALTH_PATH="${PUBLIC_HEALTH_PATH:-${PUBLIC_PING_PATH:-/api/health}}"
PUBLIC_VERIFY_RETRIES="${PUBLIC_VERIFY_RETRIES:-8}"
PUBLIC_VERIFY_INTERVAL="${PUBLIC_VERIFY_INTERVAL:-3}"
PUBLIC_VERIFY_TIMEOUT="${PUBLIC_VERIFY_TIMEOUT:-10}"
PUBLIC_VERIFY_INSECURE_TLS="${PUBLIC_VERIFY_INSECURE_TLS:-false}"
PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED="${PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED:-true}"
PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS="${PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS:-$PUBLIC_VERIFY_INSECURE_TLS}"
PUBLIC_EXTERNAL_ROUTE_CHECKS="${PUBLIC_EXTERNAL_ROUTE_CHECKS-https://zhangjihao.markz.fun/|智能装箱单生成器|JSON Utils - 后台管理,https://zhangjihao.markz.fun/admin.html|智能装箱单生成器|JSON Utils - 后台管理}"
EXPECTED_APP_VERSION="${EXPECTED_APP_VERSION:-}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { printf '缺少命令: %s\n' "$1" >&2; exit 1; }
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

verify_external_route_checks() {
  if [ -z "$PUBLIC_EXTERNAL_ROUTE_CHECKS" ]; then
    return 0
  fi

  local route_checks=()
  local route_check route_url expected_text forbidden_text route_body route_status route_redirect
  local route_body_file route_meta
  IFS=',' read -r -a route_checks <<< "$PUBLIC_EXTERNAL_ROUTE_CHECKS"

  for route_check in "${route_checks[@]}"; do
    IFS='|' read -r route_url expected_text forbidden_text <<< "$route_check"
    [ -n "$route_url" ] || continue

    route_body_file="$(mktemp)"
    route_meta="$(curl $CURL_TLS_ARG -sS -H 'Cache-Control: no-cache' --max-time "$PUBLIC_VERIFY_TIMEOUT" \
      -o "$route_body_file" -w '%{http_code}|%{redirect_url}' "$route_url" 2>/dev/null || true)"
    route_body="$(cat "$route_body_file")"
    rm -f "$route_body_file"
    route_status="${route_meta%%|*}"
    route_redirect="${route_meta#*|}"
    case "$route_status" in
      2*) ;;
      3*) printf '外部域名验证失败: %s 不应跳转到 "%s"\n' "$route_url" "$route_redirect" >&2; return 1 ;;
      *) printf '外部域名验证失败: %s HTTP 状态异常 "%s"\n' "$route_url" "${route_status:-ERR}" >&2; return 1 ;;
    esac
    if [ -n "$expected_text" ] && ! grep -Fq "$expected_text" <<< "$route_body"; then
      printf '外部域名验证失败: %s 缺少期望文本 "%s"\n' "$route_url" "$expected_text" >&2
      return 1
    fi
    if [ -n "$forbidden_text" ] && grep -Fq "$forbidden_text" <<< "$route_body"; then
      printf '外部域名验证失败: %s 命中禁止文本 "%s"\n' "$route_url" "$forbidden_text" >&2
      return 1
    fi
    log "外部域名验证通过: $route_url"
  done
}

require_cmd curl

CURL_TLS_ARG=""
if [ "$PUBLIC_VERIFY_INSECURE_TLS" = "true" ]; then
  CURL_TLS_ARG="-k"
fi

PUBLIC_BASE_URL="${PUBLIC_BASE_URL%/}"
EXPECTED_APP_VERSION="$(read_expected_version)"

if [ -z "$EXPECTED_APP_VERSION" ]; then
  printf '无法读取期望版本，请设置 EXPECTED_APP_VERSION 或检查 frontend/package.json\n' >&2
  exit 1
fi

VERSION_URL="${PUBLIC_BASE_URL}${PUBLIC_VERSION_PATH}"
HEALTH_URL="${PUBLIC_BASE_URL}${PUBLIC_HEALTH_PATH}"

log "验证公网部署: $PUBLIC_BASE_URL (expected v$EXPECTED_APP_VERSION)"

attempt=1
last_version="unknown"
last_health="unknown"

while [ "$attempt" -le "$PUBLIC_VERIFY_RETRIES" ]; do
  version_body="$(curl $CURL_TLS_ARG -fsS --max-time "$PUBLIC_VERIFY_TIMEOUT" "${VERSION_URL}?t=$(date +%s)" 2>/dev/null || true)"
  health_body="$(curl $CURL_TLS_ARG -fsS --max-time "$PUBLIC_VERIFY_TIMEOUT" "$HEALTH_URL" 2>/dev/null || true)"

  last_version="$(printf '%s' "$version_body" | extract_json_string version)"
  last_health="$(printf '%s' "$health_body" | extract_json_string data)"

  if [ "$last_version" = "$EXPECTED_APP_VERSION" ] && [ "$last_health" = "pong" ]; then
    log "公网验证通过: version=v$last_version, health=$last_health"
    verify_external_route_checks
    if [ "$PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED" != "false" ]; then
      require_cmd node
      log "验证公网前端静态资源"
      FRONTEND_ASSET_VERIFY_INSECURE_TLS="$PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS" \
        node "$ROOT_DIR/scripts/ci/check-production-frontend-assets.mjs" "$PUBLIC_BASE_URL"
    fi
    exit 0
  fi

  log "公网验证等待: version=${last_version:-ERR}, health=${last_health:-ERR} $attempt/$PUBLIC_VERIFY_RETRIES"
  attempt=$((attempt + 1))
  sleep "$PUBLIC_VERIFY_INTERVAL"
done

printf '公网验证失败: expected version=%s, last version=%s, last health=%s\n' \
  "$EXPECTED_APP_VERSION" "${last_version:-ERR}" "${last_health:-ERR}" >&2
exit 1
