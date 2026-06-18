#!/usr/bin/env bash
# 本地 CI 总入口：尽量复刻 GitHub Actions 的关键检查。

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

log "Frontend: install dependencies"
cd "$ROOT_DIR/frontend"
npm ci

log "Frontend: typecheck"
npm run typecheck

log "Frontend: lint"
npm run lint

log "Frontend: unit tests"
npm test

log "Frontend: scheme corpus baseline"
npm run corpus:scheme

log "Frontend: scheme corpus quality snapshot"
npm run corpus:snapshot:check

log "Frontend: scheme performance budget"
npm run perf:scheme -- --iterations 3 --strict

log "Frontend: JSONPath performance budget"
npm run perf:jsonpath -- --iterations 3 --strict

log "Frontend: production build"
npm run build

log "Frontend: preload boundary check"
npm run check:preloads

log "Frontend: E2E smoke tests"
PLAYWRIGHT_PREBUILT=1 npm run test:e2e

log "Backend: Maven test"
cd "$ROOT_DIR/backend"
if command -v mvn >/dev/null 2>&1; then
  mvn -B test
else
  log "Backend: local mvn not found, using Maven Docker image"
  docker run --rm \
    -v "$ROOT_DIR/backend:/workspace" \
    -v "$HOME/.m2:/root/.m2" \
    -w /workspace \
    maven:3.9-eclipse-temurin-17 \
    mvn -B test
fi

log "Backend: Maven package"
if command -v mvn >/dev/null 2>&1; then
  mvn -B package -DskipTests
else
  docker run --rm \
    -v "$ROOT_DIR/backend:/workspace" \
    -v "$HOME/.m2:/root/.m2" \
    -w /workspace \
    maven:3.9-eclipse-temurin-17 \
    mvn -B package -DskipTests
fi

log "Docker: compose config"
cd "$ROOT_DIR"
docker compose -f docker-compose.yml config

log "Local CI finished"
