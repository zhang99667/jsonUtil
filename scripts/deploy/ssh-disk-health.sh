#!/usr/bin/env bash
# 通过 SSH 只读检查远端磁盘与 Docker 空间状态，不执行清理动作。

set -Eeuo pipefail

SSH_HOST="${SSH_HOST:-39.97.237.248}"
SSH_USER="${SSH_USER:-markz}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/markz/apps/jsonUtil}"
SSH_SERVER_ALIVE_INTERVAL="${SSH_SERVER_ALIVE_INTERVAL:-15}"
SSH_SERVER_ALIVE_COUNT_MAX="${SSH_SERVER_ALIVE_COUNT_MAX:-10}"
DEPLOY_DISK_WARN_USED_PERCENT="${DEPLOY_DISK_WARN_USED_PERCENT:-90}"
DEPLOY_DISK_MAX_USED_PERCENT="${DEPLOY_DISK_MAX_USED_PERCENT:-95}"
DISK_HEALTH_STRICT="${DISK_HEALTH_STRICT:-false}"

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

log "检查远端磁盘与 Docker 空间: $SSH_USER@$SSH_HOST:$REMOTE_APP_DIR"
ssh "${SSH_BASE_OPTS[@]}" "$SSH_USER@$SSH_HOST" \
  bash -s -- \
    "$REMOTE_APP_DIR" \
    "$DEPLOY_DISK_WARN_USED_PERCENT" \
    "$DEPLOY_DISK_MAX_USED_PERCENT" \
    "$DISK_HEALTH_STRICT" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

APP_DIR="$1"
WARN_PERCENT="$2"
MAX_PERCENT="$3"
STRICT_MODE="$4"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

is_unsigned_int() {
  case "$1" in
    ''|*[!0-9]*)
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

print_section() {
  printf '\n== %s ==\n' "$1"
}

if ! is_unsigned_int "$WARN_PERCENT" || ! is_unsigned_int "$MAX_PERCENT"; then
  printf '磁盘水位阈值必须是整数: warn=%s, max=%s\n' "$WARN_PERCENT" "$MAX_PERCENT" >&2
  exit 2
fi

if [ ! -d "$APP_DIR" ]; then
  printf '远端应用目录不存在: %s\n' "$APP_DIR" >&2
  exit 2
fi

USED_PERCENT="$(df -P "$APP_DIR" | awk 'NR == 2 { gsub("%", "", $5); print $5 }')"
if ! is_unsigned_int "$USED_PERCENT"; then
  printf '无法读取磁盘水位: %s\n' "$APP_DIR" >&2
  exit 2
fi

print_section "磁盘水位"
df -h "$APP_DIR"
log "应用目录所在磁盘已使用 ${USED_PERCENT}% (warn ${WARN_PERCENT}%, max ${MAX_PERCENT}%)"

print_section "Docker 空间摘要"
if command -v docker >/dev/null 2>&1; then
  docker system df || true
else
  printf '远端未找到 docker 命令\n'
fi

print_section "运行中容器"
if command -v docker >/dev/null 2>&1; then
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' || true
fi

print_section "应用目录占用"
du -sh "$APP_DIR" 2>/dev/null || true
find "$APP_DIR" -maxdepth 1 -mindepth 1 -exec du -sh {} + 2>/dev/null | sort -h | tail -20 || true

print_section "安全清理建议"
cat <<'SUGGESTIONS'
只清理 Docker 未使用对象时，优先考虑：
  docker builder prune -af
  docker image prune -af
  docker container prune -f

不要在未确认业务数据归属前执行：
  docker volume prune

db-data、upload-data 等业务 volume 应保留，删除前必须先做备份和确认。
SUGGESTIONS

if [ "$USED_PERCENT" -ge "$MAX_PERCENT" ]; then
  log "状态: BLOCKED，磁盘水位达到阻断阈值"
  if [ "$STRICT_MODE" = "true" ]; then
    exit 2
  fi
elif [ "$USED_PERCENT" -ge "$WARN_PERCENT" ]; then
  log "状态: WARN，磁盘水位达到告警阈值"
  if [ "$STRICT_MODE" = "true" ]; then
    exit 1
  fi
else
  log "状态: OK，磁盘水位正常"
fi
REMOTE_SCRIPT
