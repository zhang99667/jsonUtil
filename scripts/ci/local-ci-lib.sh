#!/usr/bin/env bash
# 本地 CI 共享 helper：保持入口脚本只描述门禁顺序。

: "${ROOT_DIR:?ROOT_DIR must be set before sourcing local-ci-lib.sh}"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

run_in_root() {
  local message="$1"; shift
  log "$message"
  cd "$ROOT_DIR"
  "$@"
}

run_in_frontend() {
  local message="$1"; shift
  log "$message"
  cd "$ROOT_DIR/frontend"
  "$@"
}

use_project_java_home() {
  if [[ -n "${JAVA_HOME:-}" ]]; then
    log "Backend: using preset JAVA_HOME=$JAVA_HOME"
    return
  fi

  if [[ "$(uname -s)" == "Darwin" ]] && command -v /usr/libexec/java_home >/dev/null 2>&1; then
    local java_home
    if java_home="$(/usr/libexec/java_home -v 17 2>/dev/null)"; then
      export JAVA_HOME="$java_home"
      export PATH="$JAVA_HOME/bin:$PATH"
      log "Backend: selected Java 17 at $JAVA_HOME"
    fi
  fi
}

run_backend_maven() {
  local message="$1"; shift
  log "$message"
  cd "$ROOT_DIR/backend"
  if command -v mvn >/dev/null 2>&1; then
    mvn -B "$@"
    return
  fi

  log "Backend: local mvn not found, using Maven Docker image"
  docker run --rm \
    -v "$ROOT_DIR/backend:/workspace" \
    -v "$HOME/.m2:/root/.m2" \
    -w /workspace \
    maven:3.9-eclipse-temurin-17 \
    mvn -B "$@"
}
