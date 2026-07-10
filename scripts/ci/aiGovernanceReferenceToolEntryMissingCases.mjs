const lines = values => values.join('\n');

export const AI_GOVERNANCE_REFERENCE_TOOL_ENTRY_MISSING_CASES = [
  {
    name: 'AI 治理引用检查会报告入口文档缺失治理命令',
    file: 'AGENTS.md',
    content: lines(['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', 'docs/AI-ASSET-REGISTRY.md', '复盘沉淀', '规则/skill 回写', '治理校验']),
    contains: ['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', 'node scripts/ci/check-ai-governance.mjs'],
    expected: 'AGENTS.md: 缺少 "node scripts/ci/check-ai-governance.mjs"',
  },
  {
    name: 'AI 治理引用检查会报告入口文档缺失资产注册表',
    file: 'CLAUDE.md',
    content: lines(['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', 'node scripts/ci/check-ai-governance.mjs']),
    contains: ['docs/AI-ASSET-REGISTRY.md'],
    expected: 'CLAUDE.md: 缺少 "docs/AI-ASSET-REGISTRY.md"',
  },
  {
    name: 'AI 治理引用检查会报告入口文档缺失版本闭环文件',
    file: 'CLAUDE.md',
    content: lines([
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'node scripts/ci/check-ai-governance.mjs',
      'node scripts/ci/check-version-consistency.mjs',
      'frontend/package.json',
      'CHANGELOG.md',
    ]),
    contains: ['node scripts/ci/check-version-consistency.mjs', 'frontend/package.json', 'frontend/package-lock.json', 'CHANGELOG.md'],
    expected: 'CLAUDE.md: 缺少 "frontend/package-lock.json"',
  },
  {
    name: 'AI 治理引用检查会报告 Claude 目录 README 缺失治理入口',
    file: '.claude/README.md',
    content: lines(['AGENTS.md', 'CLAUDE.md', 'rules/code-style.md', '.claude/ai-tools-guide.md', 'node scripts/ci/check-ai-governance.mjs']),
    contains: ['AGENTS.md', 'CLAUDE.md', 'rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', '.claude/ai-tools-guide.md', 'node scripts/ci/check-ai-governance.mjs'],
    expected: '.claude/README.md: 缺少 "docs/AI-ENGINEERING-PLAYBOOK.md"',
  },
  {
    name: 'AI 治理引用检查会报告 Cursor 入口缺失 Comate 同源入口',
    file: '.cursorrules',
    content: lines(['AGENTS.md', 'CLAUDE.md', 'rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', 'node scripts/ci/check-ai-governance.mjs']),
    contains: ['.comate/rules/code-style.md'],
    expected: '.cursorrules: 缺少 ".comate/rules/code-style.md"',
  },
  {
    name: 'AI 治理引用检查会报告 Comate 入口缺失版本锁文件',
    file: '.comate/rules/code-style.md',
    content: lines(['frontend/package.json', 'CHANGELOG.md', 'node scripts/ci/check-version-consistency.mjs']),
    contains: ['frontend/package.json', 'frontend/package-lock.json', 'CHANGELOG.md'],
    expected: '.comate/rules/code-style.md: 缺少 "frontend/package-lock.json"',
  },
];
