export const workflowStaticRetentionSnippets = [
  { file: '.github/workflows/ci.yml', snippets: [
    'run: node scripts/ci/check-maintainability-budgets.mjs',
    'run: node --test scripts/ci/*.test.mjs',
    'run: node scripts/ci/check-chunk-load-recovery-catches.mjs',
    'run: node scripts/ci/check-frontend-static-retention.mjs',
    'run: node scripts/ci/check-ai-governance.mjs',
  ] },
  { file: '.github/workflows/deploy.yml', snippets: [
    `      - name: Build frontend dist
        working-directory: frontend
        run: |
          npm ci
          npm run build
          npm run check:preloads`,
    "SYNC_FRONTEND_DIST: 'true'",
    'FRONTEND_DOCKERFILE: Dockerfile.prebuilt',
    "COMPOSE_SERVICES: ${{ inputs.deploy_mode == 'prebuilt-frontend' && 'app-frontend' || '' }}",
    "COMPOSE_NO_DEPS: ${{ inputs.deploy_mode == 'prebuilt-frontend' }}",
    'public_verify_insecure_tls:',
    "DEFAULT_PUBLIC_BASE_URL: 'https://jsonutils.markz.fun'",
    'run: node scripts/ci/check-frontend-static-retention.mjs',
    'legacy_assets_file="$(mktemp)"',
    'legacy_capture_status=0',
    'node scripts/ci/check-production-frontend-assets.mjs "$base_url" --print-paths',
    'legacy_capture_status=$?',
    'Failed to capture legacy frontend assets and no asset paths were produced.',
    'printf \'LEGACY_FRONTEND_ASSETS=%s\\n\' "$legacy_assets" >> "$GITHUB_ENV"',
    'FRONTEND_ASSET_VERIFY_EXTRA_PATHS: ${{ env.LEGACY_FRONTEND_ASSETS }}',
    'PUBLIC_FRONTEND_ASSET_VERIFY_ENABLED: \'true\'',
    'PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS: ${{ inputs.public_verify_insecure_tls }}',
    'PUBLIC_VERIFY_INSECURE_TLS: ${{ inputs.public_verify_insecure_tls }}',
    'base_url="${PUBLIC_BASE_URL:-$DEFAULT_PUBLIC_BASE_URL}"',
    'run: bash scripts/deploy/verify-public-deploy.sh',
  ] },
];
