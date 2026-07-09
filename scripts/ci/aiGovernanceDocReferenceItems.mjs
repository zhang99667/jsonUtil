import {
  AI_GOVERNANCE_CUSTOM_AI_ENTRY_DIRS,
  AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES,
} from './aiGovernanceDiscoveryPatterns.mjs';

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

export const AI_TOOLS_SETUP_REFERENCES = [
  'AGENTS.md',
  'CLAUDE.md',
  '.claude/README.md',
  '.codex/README.md',
  'docs/AI-ASSET-REGISTRY.md',
  'docs/AI-GOVERNANCE-DECISIONS.md',
  '.cursorrules',
  ...AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES,
  ...AI_GOVERNANCE_CUSTOM_AI_ENTRY_DIRS,
  'MCP 配置',
  '.comate/rules/code-style.md',
  'docs/AI-CONFIG-INTEGRATION.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'node scripts/ci/check-ai-governance.mjs',
  '--json',
];
