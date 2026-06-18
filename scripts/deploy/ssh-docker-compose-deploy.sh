#!/usr/bin/env bash
# 从本机通过 SSH/rsync 同步源码到服务器，并触发 Docker Compose 部署。

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SSH_HOST="${SSH_HOST:-39.97.237.248}"
SSH_USER="${SSH_USER:-markz}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/markz/apps/jsonUtil}"
HEALTH_CHECK_URLS="${HEALTH_CHECK_URLS:-http://127.0.0.1 http://127.0.0.1/api/visitor/ping}"
SSH_SERVER_ALIVE_INTERVAL="${SSH_SERVER_ALIVE_INTERVAL:-15}"
SSH_SERVER_ALIVE_COUNT_MAX="${SSH_SERVER_ALIVE_COUNT_MAX:-10}"
FRONTEND_DOCKERFILE="${FRONTEND_DOCKERFILE:-Dockerfile}"
SYNC_FRONTEND_DIST="${SYNC_FRONTEND_DIST:-false}"
COMPOSE_SERVICES="${COMPOSE_SERVICES:-}"
COMPOSE_NO_DEPS="${COMPOSE_NO_DEPS:-false}"
DEPLOY_DISK_CHECK_ENABLED="${DEPLOY_DISK_CHECK_ENABLED:-true}"
DEPLOY_DISK_WARN_USED_PERCENT="${DEPLOY_DISK_WARN_USED_PERCENT:-90}"
DEPLOY_DISK_MAX_USED_PERCENT="${DEPLOY_DISK_MAX_USED_PERCENT:-95}"
RSYNC_EXCLUDES_FILE="$ROOT_DIR/scripts/deploy/rsync-excludes.txt"

SSH_BASE_OPTS=(
  -i "$SSH_KEY"
  -p "$SSH_PORT"
  -o StrictHostKeyChecking=accept-new
  -o ServerAliveInterval="$SSH_SERVER_ALIVE_INTERVAL"
  -o ServerAliveCountMax="$SSH_SERVER_ALIVE_COUNT_MAX"
)

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf '缺少命令: %s\n' "$1" >&2
    exit 1
  fi
}

require_cmd ssh
require_cmd rsync

build_rsync_ssh_command() {
  local command="ssh"
  local option

  for option in "${SSH_BASE_OPTS[@]}"; do
    command+=" $(printf '%q' "$option")"
  done

  printf '%s' "$command"
}

log "检查远程部署依赖"
ssh "${SSH_BASE_OPTS[@]}" "$SSH_USER@$SSH_HOST" \
  "command -v rsync >/dev/null && command -v docker >/dev/null && command -v curl >/dev/null && (docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null)"

log "创建远程目录: $REMOTE_APP_DIR"
ssh "${SSH_BASE_OPTS[@]}" "$SSH_USER@$SSH_HOST" "mkdir -p '$REMOTE_APP_DIR'"

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
  "$ROOT_DIR/" "$SSH_USER@$SSH_HOST:$REMOTE_APP_DIR/"

log "执行远程 Docker Compose 部署"
ssh "${SSH_BASE_OPTS[@]}" "$SSH_USER@$SSH_HOST" \
  "cd '$REMOTE_APP_DIR' && HEALTH_CHECK_URLS='$HEALTH_CHECK_URLS' FRONTEND_DOCKERFILE='$FRONTEND_DOCKERFILE' COMPOSE_SERVICES='$COMPOSE_SERVICES' COMPOSE_NO_DEPS='$COMPOSE_NO_DEPS' DEPLOY_DISK_CHECK_ENABLED='$DEPLOY_DISK_CHECK_ENABLED' DEPLOY_DISK_WARN_USED_PERCENT='$DEPLOY_DISK_WARN_USED_PERCENT' DEPLOY_DISK_MAX_USED_PERCENT='$DEPLOY_DISK_MAX_USED_PERCENT' bash scripts/deploy/remote-docker-compose-deploy.sh"

log "SSH 部署完成"
