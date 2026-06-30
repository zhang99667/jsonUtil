#!/bin/sh
# 将镜像内的新静态产物覆盖到持久化目录，同时保留近期旧 hash 资源。

set -eu

SOURCE_DIR="${STATIC_SOURCE_DIR:-/opt/jsonutils-dist}"
TARGET_DIR="${STATIC_TARGET_DIR:-/usr/share/nginx/html}"
RETENTION_DAYS="${STATIC_ASSET_RETENTION_DAYS:-14}"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "静态产物目录不存在，跳过同步: $SOURCE_DIR"
  exit 0
fi

mkdir -p "$TARGET_DIR"
cp -R "$SOURCE_DIR"/. "$TARGET_DIR"/

case "$RETENTION_DAYS" in
  ''|*[!0-9]*)
    echo "STATIC_ASSET_RETENTION_DAYS 不是非负整数，跳过旧资源清理: $RETENTION_DAYS"
    exit 0
    ;;
  0)
    echo "旧静态资源清理已关闭"
    exit 0
    ;;
esac

if [ -d "$TARGET_DIR/assets" ]; then
  find "$TARGET_DIR/assets" -type f -mtime +"$RETENTION_DAYS" -exec rm -f {} \; 2>/dev/null || true
fi
