#!/usr/bin/env bash
# 本地 CI 总入口：尽量复刻 GitHub Actions 的关键检查。

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# shellcheck source=scripts/ci/local-ci-lib.sh
source "$ROOT_DIR/scripts/ci/local-ci-lib.sh"

run_in_frontend "Frontend: install dependencies" npm ci
run_in_root "Governance: version consistency" node scripts/ci/check-version-consistency.mjs
run_in_frontend "Frontend: typecheck" npm run typecheck
run_in_frontend "Frontend: lint" npm run lint
run_in_frontend "Frontend: dependency security audit" env npm_config_registry=https://registry.npmjs.org npm run audit:security
run_in_frontend "Frontend: unit tests" npm test
run_in_root "Governance: Node script unit tests" node --test scripts/ci/*.test.mjs
run_in_root "Governance: MCP server unit tests" node --test scripts/mcp/*.test.mjs
run_in_root "Governance: project plugin probe tests" node --test plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/*.test.mjs
run_in_root "Governance: project plugin config auditor tests" python3 -B -m unittest discover -s plugins/codex-mcp-config-auditor/scripts -p 'test_*.py'
run_in_root "Governance: AI evolution evals" node scripts/ci/check-ai-evolution-evals.mjs
run_in_root "Governance: AI asset workspace distribution" node scripts/ci/check-ai-asset-distribution.mjs --workspace
run_in_root "Governance: workspace whitespace" node scripts/ci/check-ai-validation-whitespace.mjs
run_in_root "Governance: AI governance artifacts" node scripts/ci/write-ai-governance-artifacts.mjs
run_in_root "Governance: chunk load recovery catch audit" node scripts/ci/check-chunk-load-recovery-catches.mjs
run_in_frontend "Frontend: scheme corpus baseline" npm run corpus:scheme
run_in_frontend "Frontend: scheme corpus quality snapshot" npm run corpus:snapshot:check
run_in_frontend "Frontend: scheme performance budget" npm run perf:scheme -- --iterations 3 --strict
run_in_frontend "Frontend: JSONPath performance budget" npm run perf:jsonpath -- --iterations 3 --strict
run_in_frontend "Frontend: production build" npm run build
run_in_frontend "Frontend: preload boundary check" npm run check:preloads
run_in_root "Governance: frontend static asset retention" node scripts/ci/check-frontend-static-retention.mjs
run_in_root "Governance: deploy shell syntax" node scripts/ci/check-deploy-shell-syntax.mjs
run_in_frontend "Frontend: browser Worker E2E performance budget" env PLAYWRIGHT_PREBUILT=1 npm run perf:e2e
run_in_frontend "Frontend: E2E smoke tests" env PLAYWRIGHT_PREBUILT=1 npm run test:e2e
run_in_root "Governance: backend API matrix" node scripts/ci/check-backend-api-matrix.mjs
run_in_root "Governance: AI playbook and skill links" node scripts/ci/check-ai-governance.mjs
run_in_root "Governance: maintainability budgets" node scripts/ci/check-maintainability-budgets.mjs

use_project_java_home

run_backend_maven "Backend: Maven test" test
run_backend_maven "Backend: Maven package" package -DskipTests

run_in_root "Docker: compose config" env \
  POSTGRES_PASSWORD=ci-postgres-password \
  SPRING_DATASOURCE_PASSWORD=ci-postgres-password \
  JWT_SECRET=ci-jwt-secret-for-compose-validation \
  docker compose -f docker-compose.yml config

log "Local CI finished"
