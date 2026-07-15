#!/usr/bin/env bash
# 从本机通过 SSH/rsync 同步源码到服务器，并触发 Docker Compose 部署。

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
. "$ROOT_DIR/scripts/deploy/ssh-common.sh"
init_ssh_deploy_defaults

HEALTH_CHECK_URLS="${HEALTH_CHECK_URLS:-http://127.0.0.1 http://127.0.0.1/api/health}"
FRONTEND_DOCKERFILE="${FRONTEND_DOCKERFILE:-Dockerfile}"
SYNC_FRONTEND_DIST="${SYNC_FRONTEND_DIST:-false}"
COMPOSE_SERVICES="${COMPOSE_SERVICES:-}"
COMPOSE_NO_DEPS="${COMPOSE_NO_DEPS:-false}"
DEPLOY_DISK_CHECK_ENABLED="${DEPLOY_DISK_CHECK_ENABLED:-true}"
DEPLOY_DISK_WARN_USED_PERCENT="${DEPLOY_DISK_WARN_USED_PERCENT:-90}"
DEPLOY_DISK_MAX_USED_PERCENT="${DEPLOY_DISK_MAX_USED_PERCENT:-95}"
RSYNC_EXCLUDES_FILE="$ROOT_DIR/scripts/deploy/rsync-excludes.txt"
PUBLIC_VERIFY_ENABLED="${PUBLIC_VERIFY_ENABLED:-true}"
DEFAULT_PUBLIC_BASE_URL="${DEFAULT_PUBLIC_BASE_URL:-https://jsonutils.markz.fun}"
PUBLIC_VERIFY_INSECURE_TLS="${PUBLIC_VERIFY_INSECURE_TLS:-false}"
PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED="${PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED:-true}"
PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS="${PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS:-$PUBLIC_VERIFY_INSECURE_TLS}"
LEGACY_FRONTEND_ASSETS=""

require_cmd ssh
require_cmd rsync
validate_ssh_deploy_target

capture_legacy_frontend_assets() {
  if [ "$PUBLIC_VERIFY_ENABLED" != "true" ] || [ "$PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED" = "false" ]; then
    return 0
  fi

  require_cmd node
  local public_base_url="${PUBLIC_BASE_URL:-$DEFAULT_PUBLIC_BASE_URL}"
  local count
  local legacy_assets_file
  local legacy_capture_status=0

  log "记录部署前公网前端静态资源: $public_base_url"
  legacy_assets_file="$(mktemp)"
  FRONTEND_ASSET_VERIFY_INSECURE_TLS="$PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS" \
    node "$ROOT_DIR/scripts/ci/check-production-frontend-assets.mjs" "$public_base_url" --print-paths > "$legacy_assets_file" || legacy_capture_status=$?
  LEGACY_FRONTEND_ASSETS="$(cat "$legacy_assets_file")"
  rm -f "$legacy_assets_file"

  if [ "$legacy_capture_status" -ne 0 ] && [ -z "$LEGACY_FRONTEND_ASSETS" ]; then
    printf '部署前公网前端静态资源捕获失败，且未产出任何旧资源路径\n' >&2
    return "$legacy_capture_status"
  fi

  if [ "$legacy_capture_status" -ne 0 ]; then
    log "部署前公网资源巡检报告失败，部署后会复查已捕获的旧资源路径"
  fi

  if [ -z "$LEGACY_FRONTEND_ASSETS" ]; then
    log "未获取到部署前静态资源列表，部署后仅校验当前入口资源"
    return 0
  fi

  count="$(printf '%s' "$LEGACY_FRONTEND_ASSETS" | tr ',' '\n' | sed '/^$/d' | wc -l | tr -d ' ')"
  log "已记录部署前静态资源: ${count} 个"
}

build_rsync_ssh_command() {
  local command="ssh"
  local option

  for option in "${SSH_BASE_OPTS[@]}"; do
    command+=" $(printf '%q' "$option")"
  done

  printf '%s' "$command"
}

capture_legacy_frontend_assets

log "检查远程部署依赖并创建目录: $REMOTE_APP_DIR"
{
  declare -p REMOTE_APP_DIR
  cat <<'REMOTE_SCRIPT'
set -Eeuo pipefail
command -v rsync >/dev/null
command -v docker >/dev/null
command -v curl >/dev/null
docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null
mkdir -p -- "$REMOTE_APP_DIR"
REMOTE_SCRIPT
} | run_remote_bash

log "同步源码到远程服务器"
RSYNC_EXCLUDES=(
  --exclude-from="$RSYNC_EXCLUDES_FILE"
)

if [ "$SYNC_FRONTEND_DIST" != "true" ]; then
  RSYNC_EXCLUDES+=(--exclude='frontend/dist/')
fi

rsync -az --delete \
  -e "$(build_rsync_ssh_command)" \
  "${RSYNC_EXCLUDES[@]}" \
  -- "$ROOT_DIR/" "$SSH_USER@$SSH_HOST:$REMOTE_APP_DIR/"

log "执行远程 Docker Compose 部署"
{
  declare -p \
    REMOTE_APP_DIR \
    HEALTH_CHECK_URLS \
    FRONTEND_DOCKERFILE \
    COMPOSE_SERVICES \
    COMPOSE_NO_DEPS \
    DEPLOY_DISK_CHECK_ENABLED \
    DEPLOY_DISK_WARN_USED_PERCENT \
    DEPLOY_DISK_MAX_USED_PERCENT
  cat <<'REMOTE_SCRIPT'
set -Eeuo pipefail
cd "$REMOTE_APP_DIR"
export HEALTH_CHECK_URLS FRONTEND_DOCKERFILE COMPOSE_SERVICES COMPOSE_NO_DEPS
export DEPLOY_DISK_CHECK_ENABLED DEPLOY_DISK_WARN_USED_PERCENT DEPLOY_DISK_MAX_USED_PERCENT
bash scripts/deploy/remote-docker-compose-deploy.sh
REMOTE_SCRIPT
} | run_remote_bash

log "SSH 部署完成"

if [ "$PUBLIC_VERIFY_ENABLED" = "true" ]; then
  log "验证公网部署"
  PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-$DEFAULT_PUBLIC_BASE_URL}" \
  PUBLIC_VERIFY_INSECURE_TLS="$PUBLIC_VERIFY_INSECURE_TLS" \
  PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED="$PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED" \
  PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS="$PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS" \
  FRONTEND_ASSET_VERIFY_EXTRA_PATHS="$LEGACY_FRONTEND_ASSETS" \
    bash "$ROOT_DIR/scripts/deploy/verify-public-deploy.sh"
fi
