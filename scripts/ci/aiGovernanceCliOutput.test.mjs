import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

import { toAiGovernanceJsonReport } from './aiGovernanceCliOutput.mjs';

test('AI 治理 CLI 支持 JSON 摘要输出', () => {
  const output = execFileSync(process.execPath, ['scripts/ci/check-ai-governance.mjs', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  const report = JSON.parse(output);

  assert.equal(report.ok, true);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.reportType, 'ai-governance');
  assert.equal(report.counts.missingFiles, 0);
  assert.equal(report.counts.skillContractFailures, 0);
  assert.equal(report.counts.contractFailures, 0);
  assert.equal(report.counts.missingReferences, 0);
  assert.equal(report.failures.missingFiles.length, 0);
  assert.equal(report.failures.contractFailures.length, 0);
  assert.equal(report.counts.requiredFiles > 0, true);
  assert.equal(report.counts.referenceRules > 0, true);
});

test('AI 治理 CLI JSON 会单独输出契约失败分组', () => {
  const report = toAiGovernanceJsonReport({
    requiredFiles: ['AGENTS.md'],
    referenceRules: [{ file: 'AGENTS.md' }],
    missingFiles: [],
    skillContractFailures: [],
    contractFailures: ['scripts/ci/example.mjs: 治理契约失败'],
    missingReferences: [],
  });

  assert.equal(report.ok, false);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.reportType, 'ai-governance');
  assert.equal(report.counts.contractFailures, 1);
  assert.equal(report.counts.missingReferences, 0);
  assert.deepEqual(report.failures.contractFailures, ['scripts/ci/example.mjs: 治理契约失败']);
  assert.deepEqual(report.failures.missingReferences, []);
});
