import {
  AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES,
} from './aiGovernanceDiscoveryEntries.mjs';

export { AI_TOOLS_SETUP_REFERENCES } from './aiGovernanceToolsSetupReferenceItems.mjs';

export const AI_CONFIG_INTEGRATION_REFERENCES = [
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'docs/AI-ASSET-REGISTRY.md',
  'docs/AI-GOVERNANCE-DECISIONS.md',
  '.claude/ai-tools-guide.md',
  '.codex/skills/jsonutils-maintainer/SKILL.md',
  'MCP 配置',
  '.cursor/rules',
  ...AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES,
  'node scripts/ci/check-ai-governance.mjs',
  '显式豁免',
];
