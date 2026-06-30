#!/usr/bin/env bash
# 备份并回填部署前的前端 hash 静态资源，避免打开中的旧页面懒加载 chunk 404。
FRONTEND_LEGACY_ASSET_BACKUP_DIR="${FRONTEND_LEGACY_ASSET_BACKUP_DIR:-}"

frontend_service_selected_for_deploy() {
  local services="${COMPOSE_SERVICES:-}"
  local service="${FRONTEND_SERVICE_NAME:-app-frontend}"
  if [ -z "$services" ]; then
    return 0
  fi
  for selected_service in $services; do
    if [ "$selected_service" = "$service" ]; then
      return 0
    fi
  done
  return 1
}

backup_frontend_legacy_assets() {
  local service="${FRONTEND_SERVICE_NAME:-app-frontend}"
  local static_root="${FRONTEND_STATIC_ROOT:-/usr/share/nginx/html}"
  local container_id
  local asset_count
  if [ "${FRONTEND_LEGACY_ASSET_RETENTION_ENABLED:-true}" != "true" ]; then
    log "部署前旧前端 assets 备份已跳过"
    return 0
  fi
  if ! frontend_service_selected_for_deploy; then
    log "本次未部署前端服务，跳过旧前端 assets 备份"
    return 0
  fi
  container_id="$(compose ps -q "$service" 2>/dev/null || true)"
  if [ -z "$container_id" ]; then
    log "未发现运行中的前端容器，跳过旧前端 assets 备份"
    return 0
  fi
  FRONTEND_LEGACY_ASSET_BACKUP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/jsonutils-frontend-assets.XXXXXX")"
  mkdir -p "$FRONTEND_LEGACY_ASSET_BACKUP_DIR/assets"
  if ! compose cp "$service:$static_root/assets/." "$FRONTEND_LEGACY_ASSET_BACKUP_DIR/assets/" >/dev/null 2>&1; then
    log "部署前旧前端 assets 备份失败，继续依赖公网资源复查"
    rm -rf "$FRONTEND_LEGACY_ASSET_BACKUP_DIR"
    FRONTEND_LEGACY_ASSET_BACKUP_DIR=""
    return 0
  fi
  asset_count="$(find "$FRONTEND_LEGACY_ASSET_BACKUP_DIR/assets" -type f | wc -l | tr -d ' ')"
  if [ "$asset_count" = "0" ]; then
    log "当前前端容器没有可备份的旧 assets"
    rm -rf "$FRONTEND_LEGACY_ASSET_BACKUP_DIR"
    FRONTEND_LEGACY_ASSET_BACKUP_DIR=""
    return 0
  fi
  log "已备份部署前旧前端 assets: ${asset_count} 个"
}

restore_frontend_legacy_assets() {
  local service="${FRONTEND_SERVICE_NAME:-app-frontend}"
  local static_root="${FRONTEND_STATIC_ROOT:-/usr/share/nginx/html}"
  local asset_count
  if [ -z "$FRONTEND_LEGACY_ASSET_BACKUP_DIR" ] || [ ! -d "$FRONTEND_LEGACY_ASSET_BACKUP_DIR/assets" ]; then
    return 0
  fi
  if ! frontend_service_selected_for_deploy; then
    return 0
  fi
  asset_count="$(find "$FRONTEND_LEGACY_ASSET_BACKUP_DIR/assets" -type f | wc -l | tr -d ' ')"
  if [ "$asset_count" = "0" ]; then
    return 0
  fi
  log "回填部署前旧前端 assets: ${asset_count} 个"
  compose cp "$FRONTEND_LEGACY_ASSET_BACKUP_DIR/assets/." "$service:$static_root/assets/" >/dev/null
}

cleanup_frontend_legacy_assets() {
  if [ -n "$FRONTEND_LEGACY_ASSET_BACKUP_DIR" ]; then
    rm -rf "$FRONTEND_LEGACY_ASSET_BACKUP_DIR"
  fi
}
