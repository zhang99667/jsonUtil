import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildJsonutilsGovernanceContext } from './jsonutils-governance-context.mjs';

const withTempRoot = async (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-context-'));
  try {
    return await run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

test('governance context combines reports, project version and latest decision', async () => {
  await withTempRoot(async (rootDir) => {
    writeFile(rootDir, 'frontend/package.json', JSON.stringify({ name: 'json-helper-ai-fix', version: '1.2.3' }));
    writeFile(rootDir, 'CHANGELOG.md', '# 更新日志\n## v1.2.3 (2026-07-10) - Context\n');
    writeFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', [
      '# AI 治理决策记录',
      '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| 2026-07-10 | 建立上下文快照 | 触发 | 反例 | 边界 | `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/mcp/jsonutils-governance-context.test.mjs`; `node scripts/ci/check-ai-governance.mjs` |',
    ].join('\n'));

    const calls = [];
    const runScript = async (script, args) => {
      calls.push([script, args]);
      const stdout = script.includes('check-ai-governance')
        ? JSON.stringify({ ok: true, counts: { requiredFiles: 2 }, failures: { missingFiles: [] } })
        : JSON.stringify({
          ok: true,
          counts: { budgets: 1 },
          items: { highUsage: [{ file: 'scripts/a.mjs', lineCount: 9, maxLines: 10, remainingLines: 1, usageRatio: 0.9 }] },
        });
      return { exitCode: 0, stdout, stderr: '' };
    };

    const context = await buildJsonutilsGovernanceContext({ rootDir, top: 1, runScript });

    assert.equal(context.reportType, 'jsonutils-governance-context');
    assert.equal(context.project.version, '1.2.3');
    assert.deepEqual(context.project.latestDecision, { date: '2026-07-10', decision: '建立上下文快照' });
    assert.deepEqual(context.maintainability.highUsage.map(item => item.file), ['scripts/a.mjs']);
    assert.deepEqual(calls.map(([script]) => script), [
      'scripts/ci/check-ai-governance.mjs',
      'scripts/ci/check-maintainability-budgets.mjs',
    ]);
  });
});
