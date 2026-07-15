#!/usr/bin/env bash
# 通过 SSH 只读检查远端磁盘与 Docker 空间状态，不执行清理动作。

set -Eeuo pipefail

DEPLOY_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DEPLOY_SCRIPT_DIR/ssh-common.sh"

init_ssh_deploy_defaults
DEPLOY_DISK_WARN_USED_PERCENT="${DEPLOY_DISK_WARN_USED_PERCENT:-90}"
DEPLOY_DISK_MAX_USED_PERCENT="${DEPLOY_DISK_MAX_USED_PERCENT:-95}"
DISK_HEALTH_STRICT="${DISK_HEALTH_STRICT:-false}"

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

print_section "非运行时开发残留"
FOUND_DEV_ARTIFACTS=0
if find "$APP_DIR" -name .DS_Store -print -quit 2>/dev/null | grep -q .; then
  FOUND_DEV_ARTIFACTS=1
  find "$APP_DIR" -name .DS_Store -print 2>/dev/null | sort
fi

for item in \
  "$APP_DIR/.vscode" \
  "$APP_DIR/.idea" \
  "$APP_DIR/.cursor" \
  "$APP_DIR/.cursorrules" \
  "$APP_DIR/AGENTS.md" \
  "$APP_DIR/CLAUDE.md"
do
  if [ -e "$item" ]; then
    FOUND_DEV_ARTIFACTS=1
    du -sh "$item" 2>/dev/null || printf '%s\n' "$item"
  fi
done

if [ "$FOUND_DEV_ARTIFACTS" -eq 0 ]; then
  printf '未发现已知非运行时开发残留。\n'
else
  cat <<SUGGESTIONS
这些文件已被后续部署同步排除。确认不需要保留后，可在远端应用目录执行：
  find "$APP_DIR" -name .DS_Store -delete
  rm -rf "$APP_DIR/.vscode" "$APP_DIR/.idea" "$APP_DIR/.cursor"
  rm -f "$APP_DIR/.cursorrules" "$APP_DIR/AGENTS.md" "$APP_DIR/CLAUDE.md"
SUGGESTIONS
fi

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
