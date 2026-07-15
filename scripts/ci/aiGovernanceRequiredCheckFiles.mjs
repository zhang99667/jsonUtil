import { AI_GOVERNANCE_CI_COMMAND_FILES } from './aiGovernanceCiCommandDescriptors.mjs';
import { AI_GOVERNANCE_MCP_FILES } from './aiGovernanceRequiredMcpFiles.mjs';

export const AI_GOVERNANCE_CHECK_FILES = [
  'scripts/ci/aiGovernanceAssetDistribution.mjs',
  'scripts/ci/aiGovernanceAssetDistribution.test.mjs',
  'scripts/ci/aiGovernanceAssetDistributionFiles.mjs',
  'scripts/ci/aiGovernanceAssetDistributionFiles.test.mjs',
  'scripts/ci/aiGovernanceAssetDistributionGitEvidence.mjs',
  'scripts/ci/aiGovernanceAssetDistributionRedteam.test.mjs',
  'scripts/ci/aiGovernanceCiContract.test.mjs',
  'scripts/ci/aiGovernanceProjectCliArgs.test.mjs',
  'scripts/ci/aiGovernanceValidationChangedSet.mjs',
  'scripts/ci/aiGovernanceValidationChangedSet.test.mjs',
  'scripts/ci/aiGovernanceValidationWhitespace.mjs',
  'scripts/ci/aiGovernanceValidationWhitespace.test.mjs',
  'scripts/ci/check-deploy-shell-syntax.mjs',
  'scripts/ci/check-frontend-static-retention.mjs',
  'scripts/ci/check-production-frontend-assets.mjs',
  'scripts/ci/check-chunk-load-recovery-catches.mjs',
  ...AI_GOVERNANCE_MCP_FILES,
  ...AI_GOVERNANCE_CI_COMMAND_FILES,
];
