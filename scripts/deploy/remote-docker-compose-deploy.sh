#!/usr/bin/env bash
# 在远程服务器应用目录内执行的 Docker Compose 部署脚本。

set -Eeuo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTH_CHECK_URLS="${HEALTH_CHECK_URLS:-http://127.0.0.1 http://127.0.0.1/api/health}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-3}"
export FRONTEND_DOCKERFILE="${FRONTEND_DOCKERFILE:-Dockerfile}"
COMPOSE_SERVICES="${COMPOSE_SERVICES:-}"
COMPOSE_NO_DEPS="${COMPOSE_NO_DEPS:-false}"
DEPLOY_DISK_CHECK_ENABLED="${DEPLOY_DISK_CHECK_ENABLED:-true}"
DEPLOY_DISK_WARN_USED_PERCENT="${DEPLOY_DISK_WARN_USED_PERCENT:-90}"
DEPLOY_DISK_MAX_USED_PERCENT="${DEPLOY_DISK_MAX_USED_PERCENT:-95}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "缺少命令: $1"
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
  else
    fail '缺少 docker compose 或 docker-compose'
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

is_unsigned_int() {
  [[ "$1" =~ ^[0-9]+$ ]]
}

check_disk_watermark() {
  local path="$1"
  local used_percent

  if [ "$DEPLOY_DISK_CHECK_ENABLED" != "true" ]; then
    log "磁盘水位检查已跳过"
    return 0
  fi

  if ! is_unsigned_int "$DEPLOY_DISK_WARN_USED_PERCENT" || ! is_unsigned_int "$DEPLOY_DISK_MAX_USED_PERCENT"; then
    printf '磁盘水位阈值必须是整数: DEPLOY_DISK_WARN_USED_PERCENT=%s, DEPLOY_DISK_MAX_USED_PERCENT=%s\n' \
      "$DEPLOY_DISK_WARN_USED_PERCENT" "$DEPLOY_DISK_MAX_USED_PERCENT" >&2
    return 1
  fi

  used_percent="$(df -P "$path" | awk 'NR == 2 { gsub("%", "", $5); print $5 }')"
  if ! is_unsigned_int "$used_percent"; then
    log "无法读取磁盘水位，跳过部署磁盘检查: $path"
    return 0
  fi

  log "磁盘水位: $path 已使用 ${used_percent}% (warn ${DEPLOY_DISK_WARN_USED_PERCENT}%, max ${DEPLOY_DISK_MAX_USED_PERCENT}%)"

  if [ "$used_percent" -ge "$DEPLOY_DISK_WARN_USED_PERCENT" ]; then
    log "磁盘水位告警: 请尽快清理 Docker 未使用镜像/构建缓存，避免数据库和镜像构建写入失败"
    docker system df || true
  fi

  if [ "$used_percent" -ge "$DEPLOY_DISK_MAX_USED_PERCENT" ]; then
    printf '磁盘水位过高，已停止部署: %s 已使用 %s%%，达到阻断阈值 %s%%。\n' \
      "$path" "$used_percent" "$DEPLOY_DISK_MAX_USED_PERCENT" >&2
    printf '建议先执行 docker builder prune -af 或 docker image prune -af，并确认不要删除 db-data、upload-data 等业务 volume。\n' >&2
    return 1
  fi
}

cd "$APP_DIR"

require_cmd docker
require_cmd curl

# shellcheck source=scripts/deploy/frontend-legacy-assets.sh
. "$APP_DIR/scripts/deploy/frontend-legacy-assets.sh"
trap cleanup_frontend_legacy_assets EXIT

[ -f "$COMPOSE_FILE" ] || fail "未找到 compose 文件: $APP_DIR/$COMPOSE_FILE"
[ -f .env ] || fail '缺少 .env，请先复制 deploy.env.example 到远程应用目录并配置生产密钥'
! grep -Eq '^(POSTGRES_PASSWORD|SPRING_DATASOURCE_PASSWORD|JWT_SECRET)=change-me' .env \
  || fail '.env 中存在未替换的示例密钥，请先更新 POSTGRES_PASSWORD、SPRING_DATASOURCE_PASSWORD 和 JWT_SECRET'

if grep -Eq '^ADMIN_BOOTSTRAP_ENABLED=true$' .env && grep -Eq '^ADMIN_BOOTSTRAP_PASSWORD=change-me' .env; then
  fail '.env 已启用管理员初始化，但 ADMIN_BOOTSTRAP_PASSWORD 仍为示例值'
fi

check_disk_watermark "$APP_DIR"

log "校验 Docker Compose 配置"
compose config >/dev/null
backup_frontend_legacy_assets

log "构建并启动服务"
UP_ARGS=(up -d --build --remove-orphans)
if [ "$COMPOSE_NO_DEPS" = "true" ]; then
  UP_ARGS+=(--no-deps)
fi
if [ -n "$COMPOSE_SERVICES" ]; then
  read -r -a SERVICE_ARGS <<< "$COMPOSE_SERVICES"
  UP_ARGS+=("${SERVICE_ARGS[@]}")
fi
compose "${UP_ARGS[@]}"
restore_frontend_legacy_assets

log "当前服务状态"
compose ps

for url in $HEALTH_CHECK_URLS; do
  health_check_url "$url"
done

log "部署完成"
