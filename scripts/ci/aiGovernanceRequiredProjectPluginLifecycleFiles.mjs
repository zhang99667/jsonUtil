export const AI_GOVERNANCE_PROJECT_PLUGIN_NAMES = Object.freeze([
  'ai-infra-controller-probe',
  'jsonutils-governance-mcp',
  'codex-mcp-config-auditor',
]);

export const AI_GOVERNANCE_REQUIRED_PROJECT_PLUGIN_LIFECYCLE_FILES = Object.freeze([
  'scripts/ci/aiGovernanceRequiredProjectPluginLifecycleFiles.mjs',
  'scripts/ci/aiGovernanceProjectPluginCommand.mjs',
  'scripts/ci/aiGovernanceProjectPluginCommand.test.mjs',
  'scripts/ci/aiGovernanceProjectPluginLifecycle.mjs',
  'scripts/ci/aiGovernanceProjectPluginLifecycle.test.mjs',
  'scripts/ci/aiGovernanceProjectPluginLockWriteRace.test.mjs',
  'scripts/ci/manage-project-plugins.mjs',
]);
