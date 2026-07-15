import {
  AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES,
} from './aiGovernanceDiscoveryEntries.mjs';

export { AI_TOOLS_SETUP_REFERENCES } from './aiGovernanceToolsSetupReferenceItems.mjs';

export const AI_CONFIG_INTEGRATION_REFERENCES = [
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'docs/AI-EVOLUTION-PLAYBOOK.md',
  'docs/AI-ASSET-REGISTRY.md',
  'docs/AI-GOVERNANCE-DECISIONS.md',
  '.claude/ai-tools-guide.md',
  '.agents/skills/jsonutils-maintainer/SKILL.md',
  '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md',
  'MCP 配置',
  '.codex/config.toml',
  'trusted project',
  '新建任务',
  '兼容/可分发包',
  '.agents/plugins/marketplace.json',
  'plugins/',
  'source of truth',
  '.cursor/rules',
  ...AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES,
  'node scripts/ci/check-ai-governance.mjs',
  'node scripts/ci/check-ai-evolution-evals.mjs',
  '显式豁免',
];
