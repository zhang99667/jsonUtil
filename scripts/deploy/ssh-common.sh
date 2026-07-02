#!/usr/bin/env bash
# SSH 部署脚本共享的本地连接参数和基础工具函数。

init_ssh_deploy_defaults() {
  SSH_HOST="${SSH_HOST:-39.97.237.248}"
  SSH_USER="${SSH_USER:-markz}"
  SSH_PORT="${SSH_PORT:-22}"
  SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
  REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/markz/apps/jsonUtil}"
  SSH_SERVER_ALIVE_INTERVAL="${SSH_SERVER_ALIVE_INTERVAL:-15}"
  SSH_SERVER_ALIVE_COUNT_MAX="${SSH_SERVER_ALIVE_COUNT_MAX:-10}"
  SSH_BASE_OPTS=(
    -i "$SSH_KEY"
    -p "$SSH_PORT"
    -o StrictHostKeyChecking=accept-new
    -o ServerAliveInterval="$SSH_SERVER_ALIVE_INTERVAL"
    -o ServerAliveCountMax="$SSH_SERVER_ALIVE_COUNT_MAX"
  )
}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf '缺少命令: %s\n' "$1" >&2
    exit 1
  fi
}
