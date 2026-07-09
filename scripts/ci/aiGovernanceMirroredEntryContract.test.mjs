import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMirroredEntryContractFailures } from './aiGovernanceMirroredEntryContracts.mjs';
import {
  AI_ENTRY_SHARED_SNIPPET_DESCRIPTORS,
  AI_ENTRY_SHARED_SNIPPET_FILES,
  AI_ENTRY_SHARED_SNIPPETS,
} from './aiGovernanceSharedEntrySnippets.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const mirroredAgentSection = [
  '## AI 协作与子 Agent 委派',
  '',
  '- 跨模块排查、影响面分析、复杂重构或多条验证链路并行时，先判断是否需要子 Agent 委派；委派任务说明读写范围、排除项、期望输出和未覆盖风险，只读调查交给 explorer，限定写入交给 worker，构建/测试复核交给 verifier。',
  '- 主线程负责拆分边界、保护上下文、整合证据和最终验证；子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，不回传大段中间日志。',
  '- 如果当前工具不可委派，主线程应收窄 `rg`、测试和日志输出，继续按 `docs/AI-ENGINEERING-PLAYBOOK.md` 完成本地闭环。',
  '- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，再按 Playbook 做规则/skill 回写，并运行 `node scripts/ci/check-ai-governance.mjs` 锁定关键引用和 skill 契约。',
].join('\n');

const writeMirroredEntryFixture = (rootDir) => {
  writeFixtureFile(rootDir, 'AGENTS.md', mirroredAgentSection);
  writeFixtureFile(rootDir, 'CLAUDE.md', mirroredAgentSection);
  AI_ENTRY_SHARED_SNIPPET_FILES.forEach((file) => {
    writeFixtureFile(rootDir, file, AI_ENTRY_SHARED_SNIPPETS.join('\n'));
  });
  new Set(AI_ENTRY_SHARED_SNIPPET_DESCRIPTORS.map(({ authorityFile }) => authorityFile))
    .forEach((file) => {
      const anchors = AI_ENTRY_SHARED_SNIPPET_DESCRIPTORS
        .filter(({ authorityFile }) => authorityFile === file)
        .flatMap(({ authorityContains }) => authorityContains);
      writeFixtureFile(rootDir, file, anchors.join('\n'));
    });
};

test('AI 治理同源入口检查会报告 AGENTS 与 CLAUDE 协作章节漂移', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);
    writeFixtureFile(rootDir, 'CLAUDE.md', mirroredAgentSection.replace('下一步建议：', ''));

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), [
      'CLAUDE.md: ## AI 协作与子 Agent 委派 与 AGENTS.md 的 ## AI 协作与子 Agent 委派 不一致',
    ]);
  });
});

test('AI 治理同源入口检查会报告工具入口共享核心片段漂移', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);
    writeFixtureFile(rootDir, '.github/copilot-instructions.md', AI_ENTRY_SHARED_SNIPPETS.slice(1).join('\n'));

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), [
      `.github/copilot-instructions.md: 缺少同源入口片段 "${AI_ENTRY_SHARED_SNIPPETS[0]}"`,
    ]);
  });
});

test('AI 治理同源入口检查会报告共享片段缺少权威来源锚点', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);
    writeFixtureFile(rootDir, 'rules/code-style.md', 'frontend/package.json');

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), [
      'rules/code-style.md: 同源入口片段权威来源缺少 "frontend/package-lock.json"',
      'rules/code-style.md: 同源入口片段权威来源缺少 "CHANGELOG.md"',
      'rules/code-style.md: 同源入口片段权威来源缺少 "node scripts/ci/check-version-consistency.mjs"',
    ]);
  });
});

test('AI 治理同源入口检查会报告工具薄入口独立更新记录', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);
    writeFixtureFile(rootDir, '.claude/ai-tools-guide.md', `${AI_ENTRY_SHARED_SNIPPETS.join('\n')}\n## 更新记录\n- old`);

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), [
      '.claude/ai-tools-guide.md: 工具薄入口不应维护独立更新记录 "## 更新记录"，请使用 docs/AI-GOVERNANCE-DECISIONS.md 和 CHANGELOG.md',
    ]);
  });
});

test('AI 治理同源入口检查接受所有工具入口共享核心片段', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), []);
  });
});
