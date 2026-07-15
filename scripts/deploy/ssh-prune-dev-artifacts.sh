#!/usr/bin/env bash
# 通过 SSH 清理远端部署目录中的非运行时开发残留；默认 dry-run。

set -Eeuo pipefail

SSH_HOST="${SSH_HOST:-39.97.237.248}"
SSH_USER="${SSH_USER:-markz}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/markz/apps/jsonUtil}"
SSH_SERVER_ALIVE_INTERVAL="${SSH_SERVER_ALIVE_INTERVAL:-15}"
SSH_SERVER_ALIVE_COUNT_MAX="${SSH_SERVER_ALIVE_COUNT_MAX:-10}"
REMOTE_CLEAN_APPLY="${REMOTE_CLEAN_APPLY:-false}"
REMOTE_CLEAN_CONFIRM="${REMOTE_CLEAN_CONFIRM:-}"

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

log "检查远端非运行时开发残留: $SSH_USER@$SSH_HOST:$REMOTE_APP_DIR"
ssh "${SSH_BASE_OPTS[@]}" "$SSH_USER@$SSH_HOST" \
  bash -s -- "$REMOTE_APP_DIR" "$REMOTE_CLEAN_APPLY" "$REMOTE_CLEAN_CONFIRM" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

APP_DIR="$1"
APPLY="$2"
CONFIRM="${3:-}"

print_section() {
  printf '\n== %s ==\n' "$1"
}

if [ -z "$APP_DIR" ] || [ "$APP_DIR" = "/" ]; then
  printf '拒绝清理不安全的应用目录: %s\n' "$APP_DIR" >&2
  exit 2
fi

if [ ! -d "$APP_DIR" ]; then
  printf '远端应用目录不存在: %s\n' "$APP_DIR" >&2
  exit 2
fi

TMP_CANDIDATES="$(mktemp)"
trap 'rm -f "$TMP_CANDIDATES"' EXIT

find "$APP_DIR" -name .DS_Store -print 2>/dev/null >> "$TMP_CANDIDATES" || true

for item in \
  "$APP_DIR/.vscode" \
  "$APP_DIR/.idea" \
  "$APP_DIR/.cursor" \
  "$APP_DIR/.cursorrules" \
  "$APP_DIR/AGENTS.md" \
  "$APP_DIR/CLAUDE.md"
do
  if [ -e "$item" ]; then
    printf '%s\n' "$item" >> "$TMP_CANDIDATES"
  fi
done

sort -u "$TMP_CANDIDATES" -o "$TMP_CANDIDATES"

print_section "待清理候选"
if [ ! -s "$TMP_CANDIDATES" ]; then
  printf '未发现已知非运行时开发残留。\n'
  exit 0
fi

while IFS= read -r item; do
  du -sh "$item" 2>/dev/null || printf '%s\n' "$item"
done < "$TMP_CANDIDATES"

if [ "$APPLY" != "true" ]; then
  print_section "Dry-run"
  printf '未执行删除。确认候选项无误后，可设置 REMOTE_CLEAN_APPLY=true REMOTE_CLEAN_CONFIRM=prune-dev-artifacts 再运行。\n'
  exit 0
fi

if [ "$CONFIRM" != "prune-dev-artifacts" ]; then
  printf '已请求执行删除，但缺少确认: 请设置 REMOTE_CLEAN_CONFIRM=prune-dev-artifacts\n' >&2
  exit 2
fi

print_section "执行清理"
while IFS= read -r item; do
  printf '删除: %s\n' "$item"
  rm -rf "$item"
done < "$TMP_CANDIDATES"

print_section "清理后复查"
if find "$APP_DIR" -name .DS_Store -print -quit 2>/dev/null | grep -q .; then
  find "$APP_DIR" -name .DS_Store -print 2>/dev/null | sort
fi

FOUND_LEFTOVER=0
for item in \
  "$APP_DIR/.vscode" \
  "$APP_DIR/.idea" \
  "$APP_DIR/.cursor" \
  "$APP_DIR/.cursorrules" \
  "$APP_DIR/AGENTS.md" \
  "$APP_DIR/CLAUDE.md"
do
  if [ -e "$item" ]; then
    FOUND_LEFTOVER=1
    printf '仍存在: %s\n' "$item"
  fi
done

if [ "$FOUND_LEFTOVER" -eq 0 ] && ! find "$APP_DIR" -name .DS_Store -print -quit 2>/dev/null | grep -q .; then
  printf '已清理已知非运行时开发残留。\n'
fi
REMOTE_SCRIPT
