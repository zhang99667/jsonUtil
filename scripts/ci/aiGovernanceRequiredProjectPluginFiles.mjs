import {
  AI_GOVERNANCE_PROJECT_PLUGIN_NAMES,
  AI_GOVERNANCE_REQUIRED_PROJECT_PLUGIN_LIFECYCLE_FILES,
} from './aiGovernanceRequiredProjectPluginLifecycleFiles.mjs';

export { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES };
export { PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE } from './aiGovernanceProjectPluginLifecycle.mjs';

export const AI_GOVERNANCE_PROJECT_PLUGIN_SOURCE_FILES = Object.freeze([
  '.agents/plugins/marketplace.json',
  'plugins/ai-infra-controller-probe/.codex-plugin/plugin.json',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/SKILL.md',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/agents/openai.yaml',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/evals/evals.json',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/references/report-contract.md',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/controller-probe.mjs',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/controller-probe.test.mjs',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/run-controller-probe.mjs',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/run-seatbelt-sentinel.mjs',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel-child.mjs',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel.mjs',
  'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel.test.mjs',
  'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json',
  'plugins/jsonutils-governance-mcp/.mcp.json',
  'plugins/jsonutils-governance-mcp/README.md',
  'plugins/jsonutils-governance-mcp/scripts/server.mjs',
  'plugins/codex-mcp-config-auditor/.codex-plugin/plugin.json',
  'plugins/codex-mcp-config-auditor/.mcp.json',
  'plugins/codex-mcp-config-auditor/README.md',
  'plugins/codex-mcp-config-auditor/scripts/server.py',
  'plugins/codex-mcp-config-auditor/scripts/test_server.py',
]);

export const AI_GOVERNANCE_REQUIRED_PROJECT_PLUGIN_FILES = Object.freeze([
  ...AI_GOVERNANCE_PROJECT_PLUGIN_SOURCE_FILES,
  '.agents/plugins/plugin-lock.json',
  'scripts/ci/aiGovernanceRequiredProjectPluginFiles.mjs',
  'scripts/ci/aiGovernanceProjectPlugins.mjs',
  'scripts/ci/aiGovernanceProjectPlugins.test.mjs',
  'scripts/ci/aiGovernanceProjectPluginLock.mjs',
  'scripts/ci/aiGovernanceProjectPluginLock.test.mjs',
  'scripts/ci/aiGovernanceCodexMcpConfigAuditor.test.mjs',
  'scripts/ci/check-project-plugin-installation.mjs',
  'scripts/ci/maintainability-budget-governance-ai-project-plugin-rules.mjs',
  ...AI_GOVERNANCE_REQUIRED_PROJECT_PLUGIN_LIFECYCLE_FILES,
]);
