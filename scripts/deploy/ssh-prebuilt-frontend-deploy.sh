#!/usr/bin/env bash
# 本机构建前端 dist，并通过预构建镜像只替换远端前端服务。

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf '缺少命令: %s\n' "$1" >&2
    exit 1
  fi
}

require_cmd npm
require_cmd node

log "检查前端发布版本一致性"
node "$ROOT_DIR/scripts/ci/check-version-consistency.mjs"

log "构建前端 dist"
(
  cd "$FRONTEND_DIR"
  npm run build
  npm run check:preloads
)

if [ ! -f "$FRONTEND_DIR/dist/version.json" ]; then
  printf '未找到前端构建产物: %s\n' "$FRONTEND_DIR/dist/version.json" >&2
  exit 1
fi

APP_VERSION="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); console.log(data.versionLabel || data.version || 'unknown');" "$FRONTEND_DIR/dist/version.json")"
log "准备部署前端产物: $APP_VERSION"

SYNC_FRONTEND_DIST=true \
FRONTEND_DOCKERFILE=Dockerfile.prebuilt \
COMPOSE_SERVICES=app-frontend \
COMPOSE_NO_DEPS=true \
bash "$ROOT_DIR/scripts/deploy/ssh-docker-compose-deploy.sh"
