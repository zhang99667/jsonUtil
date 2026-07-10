const lines = values => values.join('\n');

export const AI_GOVERNANCE_REFERENCE_DOCS_MISSING_CASES = [
  {
    name: 'AI 治理引用检查会报告配置分层说明缺失决策账本',
    file: 'docs/AI-CONFIG-INTEGRATION.md',
    content: lines(['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', 'docs/AI-ASSET-REGISTRY.md', '显式豁免']),
    contains: ['docs/AI-GOVERNANCE-DECISIONS.md'],
    expected: 'docs/AI-CONFIG-INTEGRATION.md: 缺少 "docs/AI-GOVERNANCE-DECISIONS.md"',
  },
  {
    name: 'AI 治理引用检查会报告配置分层说明缺失 Copilot 根入口',
    file: 'docs/AI-CONFIG-INTEGRATION.md',
    content: lines(['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', 'docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md', '.cursor/rules', '显式豁免']),
    contains: ['.github/copilot-instructions.md'],
    expected: 'docs/AI-CONFIG-INTEGRATION.md: 缺少 ".github/copilot-instructions.md"',
  },
  {
    name: 'AI 治理引用检查会报告工具索引缺失决策账本',
    file: 'docs/AI-TOOLS-SETUP.md',
    content: lines(['docs/AI-CONFIG-INTEGRATION.md', 'docs/AI-ASSET-REGISTRY.md', 'node scripts/ci/check-ai-governance.mjs']),
    contains: ['docs/AI-GOVERNANCE-DECISIONS.md'],
    expected: 'docs/AI-TOOLS-SETUP.md: 缺少 "docs/AI-GOVERNANCE-DECISIONS.md"',
  },
  {
    name: 'AI 治理引用检查会报告工具索引缺失治理 JSON 输出',
    file: 'docs/AI-TOOLS-SETUP.md',
    content: lines(['docs/AI-CONFIG-INTEGRATION.md', 'docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md', 'node scripts/ci/check-ai-governance.mjs']),
    contains: ['--json'],
    expected: 'docs/AI-TOOLS-SETUP.md: 缺少 "--json"',
  },
  {
    name: 'AI 治理引用检查会报告资产注册表缺失 Copilot 根入口人审契约',
    file: 'docs/AI-ASSET-REGISTRY.md',
    content: lines(['AGENTS.md', 'CLAUDE.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', 'docs/AI-GOVERNANCE-DECISIONS.md', '.codex/skills/jsonutils-maintainer/SKILL.md', 'scripts/ci/check-ai-governance.mjs', 'scripts/ci/aiGovernanceAssetRegistryEvidence.mjs', 'referenceRules.file', '治理证据', '显式豁免']),
    contains: ['Copilot 根入口'],
    expected: 'docs/AI-ASSET-REGISTRY.md: 缺少 "Copilot 根入口"',
  },
];
