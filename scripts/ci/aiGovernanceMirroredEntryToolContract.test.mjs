import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMirroredEntryContractFailures } from './aiGovernanceMirroredEntryContracts.mjs';
import { writeMirroredEntryFixture } from './aiGovernanceMirroredEntryTestFixtures.mjs';
import { AI_ENTRY_SHARED_SNIPPETS } from './aiGovernanceSharedEntrySnippets.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

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
