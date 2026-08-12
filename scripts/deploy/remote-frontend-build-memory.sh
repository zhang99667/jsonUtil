#!/usr/bin/env bash
# 远端前端源码构建的内存前置检查；预构建产物不需要该资源门槛。

read_remote_memory_kib() {
  local field="$1"
  local meminfo_path="$2"

  awk -v field="$field:" '
    $1 == field && $2 ~ /^[0-9]+$/ && $3 == "kB" { print $2; found = 1; exit }
    END { if (!found) exit 1 }
  ' "$meminfo_path"
}

check_remote_frontend_build_memory() {
  local meminfo_path="${1:-/proc/meminfo}"
  local minimum_mib="${REMOTE_FRONTEND_BUILD_MIN_AVAILABLE_MIB:-4096}"
  local mem_available_kib
  local swap_free_kib
  local available_mib

  if [ "${FRONTEND_DOCKERFILE##*/}" = "Dockerfile.prebuilt" ]; then
    printf '前端使用预构建产物，跳过远端源码构建内存检查\n'
    return 0
  fi

  if [[ ! "$minimum_mib" =~ ^[1-9][0-9]*$ ]] \
    || [ "${#minimum_mib}" -gt 7 ] \
    || [ "$minimum_mib" -gt 1048576 ]; then
    printf '远端前端源码构建内存门槛必须是正整数 MiB: %s\n' "$minimum_mib" >&2
    return 1
  fi

  mem_available_kib="$(read_remote_memory_kib MemAvailable "$meminfo_path" 2>/dev/null || true)"
  swap_free_kib="$(read_remote_memory_kib SwapFree "$meminfo_path" 2>/dev/null || true)"
  if [[ ! "$mem_available_kib" =~ ^[0-9]+$ ]] \
    || [[ ! "$swap_free_kib" =~ ^[0-9]+$ ]] \
    || [ "${#mem_available_kib}" -gt 15 ] \
    || [ "${#swap_free_kib}" -gt 15 ]; then
    printf '无法读取远端可用内存，已停止前端源码构建；请改用 scripts/deploy/ssh-prebuilt-frontend-deploy.sh\n' >&2
    return 1
  fi

  available_mib=$(((10#$mem_available_kib + 10#$swap_free_kib) / 1024))
  printf '远端前端源码构建可用内存: %s MiB (最低 %s MiB)\n' "$available_mib" "$minimum_mib"
  if [ "$available_mib" -lt "$minimum_mib" ]; then
    printf '远端前端源码构建可用内存不足，已在 Compose 前停止；请改用 scripts/deploy/ssh-prebuilt-frontend-deploy.sh\n' >&2
    return 1
  fi
}
