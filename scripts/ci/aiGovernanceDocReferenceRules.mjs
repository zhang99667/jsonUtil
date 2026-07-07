import { AI_GOVERNANCE_CUSTOM_AI_ENTRY_DIRS, AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES } from './aiGovernanceDiscoveryPatterns.mjs';

export const AI_GOVERNANCE_DOC_REFERENCE_RULES = [
  {
    file: 'docs/AI-CONFIG-INTEGRATION.md',
    contains: [
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'docs/AI-ASSET-REGISTRY.md',
      'docs/AI-GOVERNANCE-DECISIONS.md',
      '.claude/ai-tools-guide.md',
      '.codex/skills/jsonutils-maintainer/SKILL.md', 'MCP 配置', '.cursor/rules',
      ...AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES,
      'node scripts/ci/check-ai-governance.mjs',
      '显式豁免',
    ],
  },
  {
    file: 'docs/AI-TOOLS-SETUP.md',
    contains: [
      'AGENTS.md',
      'CLAUDE.md',
      '.claude/README.md',
      '.codex/README.md',
      'docs/AI-ASSET-REGISTRY.md',
      'docs/AI-GOVERNANCE-DECISIONS.md',
      '.cursorrules', ...AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES, ...AI_GOVERNANCE_CUSTOM_AI_ENTRY_DIRS, 'MCP 配置',
      '.comate/rules/code-style.md',
      'docs/AI-CONFIG-INTEGRATION.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'node scripts/ci/check-ai-governance.mjs',
    ],
  },
];
