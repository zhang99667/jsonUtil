import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const codexSkillFiles = ['.codex/skills/jsonutils-maintainer/SKILL.md'];
const lines = values => values.join('\n');

const missingReferenceCases = [
  {
    name: 'AI 治理引用检查会报告缺失的 fallback 成 HTML 语义',
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    content: 'Content-Type',
    contains: ['Content-Type', 'fallback 成 HTML'],
    expected: 'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "fallback 成 HTML"',
  },
  {
    name: 'AI 治理引用检查会报告缺失的旧 chunk 复查参数',
    file: '.codex/README.md',
    content: lines([
      'node scripts/ci/check-production-frontend-assets.mjs',
      'Content-Type',
      'fallback 成 HTML',
    ]),
    contains: ['--extra-asset'],
    expected: '.codex/README.md: 缺少 "--extra-asset"',
  },
  {
    name: 'AI 治理引用检查会报告缺失的 CSS 二级资源巡检语义',
    file: '.claude/ai-tools-guide.md',
    content: lines([
      'node scripts/ci/check-production-frontend-assets.mjs',
      'Content-Type',
      'fallback 成 HTML',
      '--extra-asset',
    ]),
    contains: ['CSS `url(...)`'],
    expected: '.claude/ai-tools-guide.md: 缺少 "CSS `url(...)`"',
  },
  {
    name: 'AI 治理引用检查会报告缺失的 CSS import 巡检语义',
    file: '.codex/README.md',
    content: lines([
      'node scripts/ci/check-production-frontend-assets.mjs',
      'Content-Type',
      'fallback 成 HTML',
      'CSS `url(...)`',
      '--extra-asset',
    ]),
    contains: ['CSS `@import`'],
    expected: '.codex/README.md: 缺少 "CSS `@import`"',
  },
  {
    name: 'AI 治理引用检查会报告缺失的 AI 安全边界',
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    content: lines(['本地规则优先', '用户手动触发', '可验证闭环']),
    contains: ['敏感内容不外泄'],
    expected: 'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "敏感内容不外泄"',
  },
  {
    name: 'AI 治理引用检查会报告缺失的 AI 证据形态',
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    content: lines(['本地规则优先', '用户手动触发', '敏感内容不外泄', '可验证闭环', '测试', '脚本']),
    contains: ['可复核日志'],
    expected: 'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "可复核日志"',
  },
  {
    name: 'AI 治理引用检查会报告缺失的规则进化闭环',
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    content: lines(['复盘沉淀', '治理校验']),
    contains: ['规则/skill 回写'],
    expected: 'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "规则/skill 回写"',
  },
  {
    name: 'AI 治理引用检查会报告缺失规则沉淀质量门槛',
    file: 'rules/code-style.md',
    content: lines(['复盘沉淀', '触发条件', '验证方式', '适用边界', '规则/skill 回写', '治理校验']),
    contains: ['反例'],
    expected: 'rules/code-style.md: 缺少 "反例"',
  },
  {
    name: 'AI 治理引用检查会报告缺失规则回写追踪字段',
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    content: lines(['复盘沉淀', '触发条件', '反例', '验证方式', '适用边界', '规则/skill 回写', '决策记录', '回写追踪', '治理校验']),
    contains: ['锁定测试'],
    expected: 'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "锁定测试"',
  },
  {
    name: 'AI 治理引用检查会报告入口文档缺失治理命令',
    file: 'AGENTS.md',
    content: lines(['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', '复盘沉淀', '规则/skill 回写', '治理校验']),
    contains: ['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', 'node scripts/ci/check-ai-governance.mjs'],
    expected: 'AGENTS.md: 缺少 "node scripts/ci/check-ai-governance.mjs"',
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
  {
    name: 'AI 治理引用检查会报告缺失子 Agent 委派细节',
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    content: lines(['子 Agent 委派', '主线程负责', '拆分边界', '读写范围', '排除项', '期望输出', '收窄']),
    contains: ['未覆盖风险'],
    expected: 'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "未覆盖风险"',
  },
  {
    name: 'AI 治理引用检查会报告缺失子 Agent 输出模板字段',
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    content: lines(['子 Agent 委派', '任务：', '结论：', '证据：', '修改文件：', '验证：', '未覆盖：']),
    contains: ['下一步建议：'],
    expected: 'docs/AI-ENGINEERING-PLAYBOOK.md: 缺少 "下一步建议："',
  },
  {
    name: 'AI 治理引用检查会报告 PR 模板缺失决策账本追踪',
    file: '.github/PULL_REQUEST_TEMPLATE.md',
    content: lines(['docs/AI-ASSET-REGISTRY.md', 'node scripts/ci/check-ai-governance.mjs', '负向测试', '显式豁免', 'CHANGELOG.md']),
    contains: ['docs/AI-GOVERNANCE-DECISIONS.md'],
    expected: '.github/PULL_REQUEST_TEMPLATE.md: 缺少 "docs/AI-GOVERNANCE-DECISIONS.md"',
  },
];

missingReferenceCases.forEach(({ name, file, content, contains, expected }) => {
  test(name, () => {
    withAiGovernanceTempRoot((rootDir) => {
      writeFixtureFile(rootDir, file, content);

      assert.deepEqual(collectMissingAiGovernanceReferences(
        rootDir,
        [{ file, contains }],
        codexSkillFiles
      ), [expected]);
    });
  });
});
