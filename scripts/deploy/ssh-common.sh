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

invalid_ssh_deploy_input() {
  printf 'SSH 部署参数非法: %s\n' "$1" >&2
  return 1
}

validate_ssh_deploy_target() {
  if [[ ! "$SSH_HOST" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]*$ ]]; then
    invalid_ssh_deploy_input 'SSH_HOST 不是闭合的主机名或地址'
    return 1
  fi
  if [[ ! "$SSH_USER" =~ ^[A-Za-z_][A-Za-z0-9._-]*$ ]]; then
    invalid_ssh_deploy_input 'SSH_USER 不是闭合的用户名称'
    return 1
  fi
  if [[ ! "$SSH_PORT" =~ ^[0-9]{1,5}$ ]] || (( 10#$SSH_PORT < 1 || 10#$SSH_PORT > 65535 )); then
    invalid_ssh_deploy_input 'SSH_PORT 必须是 1 到 65535 的整数'
    return 1
  fi
  if [[ ! "$REMOTE_APP_DIR" =~ ^/[A-Za-z0-9._/-]+$ ]] ||
    [[ "$REMOTE_APP_DIR" == '/' ]] ||
    [[ "$REMOTE_APP_DIR" =~ // ]] ||
    [[ "$REMOTE_APP_DIR" =~ (^|/)\.\.?(/|$) ]]; then
    invalid_ssh_deploy_input 'REMOTE_APP_DIR 必须是非根目录、无连续斜杠和点路径段的安全绝对路径'
    return 1
  fi
}

run_remote_bash() {
  ssh "${SSH_BASE_OPTS[@]}" -- "$SSH_USER@$SSH_HOST" bash -s
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
