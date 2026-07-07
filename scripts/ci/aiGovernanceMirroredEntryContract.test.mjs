import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { collectMirroredEntryContractFailures } from './aiGovernanceMirroredEntryContracts.mjs';
import {
  AI_ENTRY_SHARED_SNIPPET_FILES,
  AI_ENTRY_SHARED_SNIPPETS,
} from './aiGovernanceSharedEntrySnippets.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-ai-mirrored-entry-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeFixtureFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

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
};

test('AI 治理同源入口检查会报告 AGENTS 与 CLAUDE 协作章节漂移', () => {
  withTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);
    writeFixtureFile(rootDir, 'CLAUDE.md', mirroredAgentSection.replace('下一步建议：', ''));

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), [
      'CLAUDE.md: ## AI 协作与子 Agent 委派 与 AGENTS.md 的 ## AI 协作与子 Agent 委派 不一致',
    ]);
  });
});

test('AI 治理同源入口检查会报告工具入口共享核心片段漂移', () => {
  withTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);
    writeFixtureFile(rootDir, '.github/copilot-instructions.md', AI_ENTRY_SHARED_SNIPPETS.slice(1).join('\n'));

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), [
      `.github/copilot-instructions.md: 缺少同源入口片段 "${AI_ENTRY_SHARED_SNIPPETS[0]}"`,
    ]);
  });
});

test('AI 治理同源入口检查接受所有工具入口共享核心片段', () => {
  withTempRoot((rootDir) => {
    writeMirroredEntryFixture(rootDir);

    assert.deepEqual(collectMirroredEntryContractFailures(rootDir), []);
  });
});
