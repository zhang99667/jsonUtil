#!/usr/bin/env bash
# 通过 SSH 清理远端 Docker 未使用对象；默认 dry-run，绝不清理 volume。

set -Eeuo pipefail

SSH_HOST="${SSH_HOST:-39.97.237.248}"
SSH_USER="${SSH_USER:-markz}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/markz/apps/jsonUtil}"
SSH_SERVER_ALIVE_INTERVAL="${SSH_SERVER_ALIVE_INTERVAL:-15}"
SSH_SERVER_ALIVE_COUNT_MAX="${SSH_SERVER_ALIVE_COUNT_MAX:-10}"
REMOTE_DOCKER_PRUNE_APPLY="${REMOTE_DOCKER_PRUNE_APPLY:-false}"
REMOTE_DOCKER_PRUNE_CONFIRM="${REMOTE_DOCKER_PRUNE_CONFIRM:-}"
REMOTE_DOCKER_PRUNE_CONTAINERS="${REMOTE_DOCKER_PRUNE_CONTAINERS:-true}"
REMOTE_DOCKER_PRUNE_BUILDER="${REMOTE_DOCKER_PRUNE_BUILDER:-true}"
REMOTE_DOCKER_PRUNE_IMAGES="${REMOTE_DOCKER_PRUNE_IMAGES:-true}"
REMOTE_DOCKER_PRUNE_CONFIRM_ARG="${REMOTE_DOCKER_PRUNE_CONFIRM:-__empty__}"

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

log "检查远端 Docker 可回收空间: $SSH_USER@$SSH_HOST:$REMOTE_APP_DIR"
ssh "${SSH_BASE_OPTS[@]}" "$SSH_USER@$SSH_HOST" \
  bash -s -- \
    "$REMOTE_APP_DIR" \
    "$REMOTE_DOCKER_PRUNE_APPLY" \
    "$REMOTE_DOCKER_PRUNE_CONFIRM_ARG" \
    "$REMOTE_DOCKER_PRUNE_CONTAINERS" \
    "$REMOTE_DOCKER_PRUNE_BUILDER" \
    "$REMOTE_DOCKER_PRUNE_IMAGES" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

APP_DIR="$1"
APPLY="$2"
CONFIRM="$3"
PRUNE_CONTAINERS="$4"
PRUNE_BUILDER="$5"
PRUNE_IMAGES="$6"

if [ "$CONFIRM" = "__empty__" ]; then
  CONFIRM=""
fi

print_section() {
  printf '\n== %s ==\n' "$1"
}

is_bool() {
  case "$1" in
    true|false)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

require_bool() {
  if ! is_bool "$2"; then
    printf '%s 必须是 true 或 false，当前为: %s\n' "$1" "$2" >&2
    exit 2
  fi
}

print_docker_space() {
  print_section "磁盘水位"
  df -h "$APP_DIR"

  print_section "Docker 空间摘要"
  docker system df || true
}

if [ -z "$APP_DIR" ] || [ "$APP_DIR" = "/" ]; then
  printf '拒绝在不安全的应用目录上下文中清理: %s\n' "$APP_DIR" >&2
  exit 2
fi

if [ ! -d "$APP_DIR" ]; then
  printf '远端应用目录不存在: %s\n' "$APP_DIR" >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  printf '远端未找到 docker 命令\n' >&2
  exit 1
fi

require_bool REMOTE_DOCKER_PRUNE_APPLY "$APPLY"
require_bool REMOTE_DOCKER_PRUNE_CONTAINERS "$PRUNE_CONTAINERS"
require_bool REMOTE_DOCKER_PRUNE_BUILDER "$PRUNE_BUILDER"
require_bool REMOTE_DOCKER_PRUNE_IMAGES "$PRUNE_IMAGES"

cd "$APP_DIR"

print_docker_space

print_section "计划动作"
if [ "$PRUNE_CONTAINERS" = "true" ]; then
  printf '将清理已停止容器: docker container prune -f\n'
fi
if [ "$PRUNE_BUILDER" = "true" ]; then
  printf '将清理未使用构建缓存: docker builder prune -af\n'
fi
if [ "$PRUNE_IMAGES" = "true" ]; then
  printf '将清理未被容器引用的镜像: docker image prune -af\n'
fi
printf '不会执行 docker volume prune，业务 volume 不在本脚本清理范围内。\n'

if [ "$PRUNE_CONTAINERS" != "true" ] && [ "$PRUNE_BUILDER" != "true" ] && [ "$PRUNE_IMAGES" != "true" ]; then
  printf '未启用任何 Docker 清理项。\n'
  exit 0
fi

if [ "$APPLY" != "true" ]; then
  print_section "Dry-run"
  printf '未执行清理。确认计划动作无误后，可设置 REMOTE_DOCKER_PRUNE_APPLY=true REMOTE_DOCKER_PRUNE_CONFIRM=prune-docker-unused 再运行。\n'
  exit 0
fi

if [ "$CONFIRM" != "prune-docker-unused" ]; then
  printf '已请求执行 Docker 清理，但缺少确认: 请设置 REMOTE_DOCKER_PRUNE_CONFIRM=prune-docker-unused\n' >&2
  exit 2
fi

print_section "执行清理"
if [ "$PRUNE_CONTAINERS" = "true" ]; then
  docker container prune -f
fi
if [ "$PRUNE_BUILDER" = "true" ]; then
  docker builder prune -af
fi
if [ "$PRUNE_IMAGES" = "true" ]; then
  docker image prune -af
fi

print_section "清理后复查"
print_docker_space
REMOTE_SCRIPT
