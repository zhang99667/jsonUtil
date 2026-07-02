export const DEFAULT_DEPLOY_SHELL_FILES = [
  '.github/scripts/docker-build-with-retry.sh',
  'frontend/docker-entrypoint.d/40-sync-static-assets.sh',
  'scripts/ci/local-ci-lib.sh',
  'scripts/ci/local-ci.sh',
  'scripts/deploy/frontend-legacy-assets.sh',
  'scripts/deploy/remote-docker-compose-deploy.sh',
  'scripts/deploy/ssh-common.sh',
  'scripts/deploy/ssh-disk-health.sh',
  'scripts/deploy/ssh-docker-compose-deploy.sh',
  'scripts/deploy/ssh-docker-prune.sh',
  'scripts/deploy/ssh-prebuilt-frontend-deploy.sh',
  'scripts/deploy/ssh-prune-dev-artifacts.sh',
  'scripts/deploy/verify-public-deploy.sh',
];

export const DEFAULT_GITHUB_WORKFLOW_FILES = ['.github/workflows/ci.yml', '.github/workflows/deploy.yml'];
