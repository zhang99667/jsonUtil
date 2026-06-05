#!/usr/bin/env bash
set -euo pipefail

image_tag="${1:?image tag is required}"
build_context="${2:?build context is required}"
max_attempts="${DOCKER_BUILD_RETRIES:-3}"
base_delay_seconds="${DOCKER_BUILD_RETRY_DELAY_SECONDS:-10}"

for ((attempt = 1; attempt <= max_attempts; attempt++)); do
  echo "Docker build attempt ${attempt}/${max_attempts}: ${image_tag}"
  if docker build -t "${image_tag}" "${build_context}"; then
    exit 0
  fi

  if ((attempt == max_attempts)); then
    echo "Docker build failed after ${max_attempts} attempts: ${image_tag}" >&2
    exit 1
  fi

  delay_seconds=$((base_delay_seconds * attempt))
  echo "Docker build failed; retrying in ${delay_seconds}s..." >&2
  sleep "${delay_seconds}"
done
