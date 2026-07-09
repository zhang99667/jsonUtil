import { AI_GOVERNANCE_CI_COMMAND_FILES } from './aiGovernanceCiCommandDescriptors.mjs';

export const AI_GOVERNANCE_CHECK_FILES = [
  'scripts/ci/check-deploy-shell-syntax.mjs',
  'scripts/ci/check-frontend-static-retention.mjs',
  'scripts/ci/check-production-frontend-assets.mjs',
  'scripts/ci/check-chunk-load-recovery-catches.mjs',
  '.mcp.json',
  'scripts/mcp/jsonutils-governance-server.mjs',
  'scripts/mcp/jsonutils-governance-context.mjs',
  ...AI_GOVERNANCE_CI_COMMAND_FILES,
];
