const lines = values => values.join('\n');

export const AI_GOVERNANCE_REFERENCE_PULL_REQUEST_MISSING_CASES = [
  {
    name: 'AI 治理引用检查会报告 PR 模板缺失决策账本追踪',
    file: '.github/PULL_REQUEST_TEMPLATE.md',
    content: lines(['docs/AI-ASSET-REGISTRY.md', 'node scripts/ci/check-ai-governance.mjs', '负向测试', '显式豁免', 'CHANGELOG.md']),
    contains: ['docs/AI-GOVERNANCE-DECISIONS.md'],
    expected: '.github/PULL_REQUEST_TEMPLATE.md: 缺少 "docs/AI-GOVERNANCE-DECISIONS.md"',
  },
  {
    name: 'AI 治理引用检查会报告 PR 模板缺失 Copilot 根入口',
    file: '.github/PULL_REQUEST_TEMPLATE.md',
    content: lines(['docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md', 'CHANGELOG.md', 'node scripts/ci/check-ai-governance.mjs', '.cursor/rules', '.github/instructions', '.github/prompts', '.github/agents', '.github/chatmodes', '负向测试', '显式豁免']),
    contains: ['.github/copilot-instructions.md', '.cursor/rules', '.github/instructions', '.github/prompts', '.github/agents', '.github/chatmodes'],
    expected: '.github/PULL_REQUEST_TEMPLATE.md: 缺少 ".github/copilot-instructions.md"',
  },
  {
    name: 'AI 治理引用检查会报告 PR 模板缺失预算提醒',
    file: '.github/PULL_REQUEST_TEMPLATE.md',
    content: lines(['docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md', 'CHANGELOG.md', 'node scripts/ci/check-ai-governance.mjs', '可维护性预算', '负向测试', '显式豁免']),
    contains: ['node scripts/ci/check-maintainability-budgets.mjs'],
    expected: '.github/PULL_REQUEST_TEMPLATE.md: 缺少 "node scripts/ci/check-maintainability-budgets.mjs"',
  },
  {
    name: 'AI 治理引用检查会报告 PR 模板缺失 Codex 原生 MCP 配置提醒',
    file: '.github/PULL_REQUEST_TEMPLATE.md',
    content: lines(['docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md', 'CHANGELOG.md', 'node scripts/ci/check-ai-governance.mjs', '.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json', '负向测试', '显式豁免']),
    contains: ['.codex/config.toml', '.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json'],
    expected: '.github/PULL_REQUEST_TEMPLATE.md: 缺少 ".codex/config.toml"',
  },
];
