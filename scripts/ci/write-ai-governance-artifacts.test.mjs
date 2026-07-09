import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { writeAiGovernanceArtifacts } from './write-ai-governance-artifacts.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-ai-artifacts-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const prepareProjectFiles = (rootDir) => {
  writeFile(rootDir, 'frontend/package.json', JSON.stringify({ name: 'json-helper-ai-fix', version: '1.8.736' }));
  writeFile(rootDir, 'CHANGELOG.md', '# 更新日志\n## v1.8.736 (2026-07-10) - 治理 MCP 上下文快照\n');
  writeFile(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md', [
    '# AI 治理决策记录',
    '| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| 2026-07-10 | 固化 CI 治理 JSON 产物 | 触发 | 反例 | 边界 | `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/ci/write-ai-governance-artifacts.test.mjs`; `node scripts/ci/check-ai-governance.mjs` |',
  ].join('\n'));
};

test('write AI governance artifacts and summary from fixed reports', () => {
  withTempRoot((rootDir) => {
    prepareProjectFiles(rootDir);
    const calls = [];
    const runReport = (script, args) => {
      calls.push([script, args]);
      return script.includes('check-ai-governance')
        ? { exitCode: 0, report: { ok: true, counts: { requiredFiles: 3 }, failures: {} } }
        : { exitCode: 0, report: { ok: true, counts: { budgets: 2 }, items: { highUsage: [{ file: 'scripts/a.mjs' }] } } };
    };

    const result = writeAiGovernanceArtifacts({
      rootDir,
      outDir: 'tmp-artifacts',
      summaryFile: path.join(rootDir, 'summary.md'),
      top: 2,
      contextTop: 1,
      runReport,
    });

    assert.equal(result.ok, true);
    assert.deepEqual(calls.map(([script]) => script), [
      'scripts/ci/check-ai-governance.mjs',
      'scripts/ci/check-maintainability-budgets.mjs',
    ]);
    assert.equal(JSON.parse(fs.readFileSync(result.files.context, 'utf8')).project.version, '1.8.736');
    assert.equal(JSON.parse(fs.readFileSync(result.files.maintainability, 'utf8')).counts.budgets, 2);
    assert.match(fs.readFileSync(path.join(rootDir, 'summary.md'), 'utf8'), /固化 CI 治理 JSON 产物/);
  });
});
