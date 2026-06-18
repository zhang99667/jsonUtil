#!/usr/bin/env bash
# 在远程服务器应用目录内执行的 Docker Compose 部署脚本。

set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTH_CHECK_URLS="${HEALTH_CHECK_URLS:-http://127.0.0.1 http://127.0.0.1/api/visitor/ping}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-3}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf '缺少命令: %s\n' "$1" >&2
    exit 1
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
  else
    printf '缺少 docker compose 或 docker-compose\n' >&2
    exit 1
  fi
}

health_check_url() {
  local url="$1"
  local attempt=1
  local code

  while [ "$attempt" -le "$HEALTH_CHECK_RETRIES" ]; do
    code="$(curl -kLsS --max-time 10 -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
    if [ "$code" = "200" ]; then
      log "健康检查通过: $url ($code)"
      return 0
    fi
    log "健康检查等待: $url (${code:-ERR}) $attempt/$HEALTH_CHECK_RETRIES"
    attempt=$((attempt + 1))
    sleep "$HEALTH_CHECK_INTERVAL"
  done

  printf '健康检查失败: %s\n' "$url" >&2
  return 1
}

cd "$APP_DIR"

require_cmd docker
require_cmd curl

if [ ! -f "$COMPOSE_FILE" ]; then
  printf '未找到 compose 文件: %s/%s\n' "$APP_DIR" "$COMPOSE_FILE" >&2
  exit 1
fi

if [ ! -f .env ]; then
  printf '缺少 .env，请先复制 deploy.env.example 到远程应用目录并配置生产密钥\n' >&2
  exit 1
fi

if grep -Eq '^(POSTGRES_PASSWORD|SPRING_DATASOURCE_PASSWORD|JWT_SECRET)=change-me' .env; then
  printf '.env 中存在未替换的示例密钥，请先更新 POSTGRES_PASSWORD、SPRING_DATASOURCE_PASSWORD 和 JWT_SECRET\n' >&2
  exit 1
fi

if grep -Eq '^ADMIN_BOOTSTRAP_ENABLED=true$' .env && grep -Eq '^ADMIN_BOOTSTRAP_PASSWORD=change-me' .env; then
  printf '.env 已启用管理员初始化，但 ADMIN_BOOTSTRAP_PASSWORD 仍为示例值\n' >&2
  exit 1
fi

log "校验 Docker Compose 配置"
compose config >/dev/null

log "构建并启动服务"
compose up -d --build --remove-orphans

log "当前服务状态"
compose ps

for url in $HEALTH_CHECK_URLS; do
  health_check_url "$url"
done

log "部署完成"
