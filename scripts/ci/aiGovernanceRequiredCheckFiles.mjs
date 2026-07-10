import { AI_GOVERNANCE_CI_COMMAND_FILES } from './aiGovernanceCiCommandDescriptors.mjs';
import { AI_GOVERNANCE_MCP_FILES } from './aiGovernanceRequiredMcpFiles.mjs';

export const AI_GOVERNANCE_CHECK_FILES = [
  'scripts/ci/check-deploy-shell-syntax.mjs',
  'scripts/ci/check-frontend-static-retention.mjs',
  'scripts/ci/check-production-frontend-assets.mjs',
  'scripts/ci/check-chunk-load-recovery-catches.mjs',
  ...AI_GOVERNANCE_MCP_FILES,
  ...AI_GOVERNANCE_CI_COMMAND_FILES,
];
