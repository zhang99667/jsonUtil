import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

test('AI 治理 CLI 支持 JSON 摘要输出', () => {
  const output = execFileSync(process.execPath, ['scripts/ci/check-ai-governance.mjs', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  const report = JSON.parse(output);

  assert.equal(report.ok, true);
  assert.equal(report.counts.missingFiles, 0);
  assert.equal(report.counts.skillContractFailures, 0);
  assert.equal(report.counts.missingReferences, 0);
  assert.equal(report.failures.missingFiles.length, 0);
  assert.equal(report.counts.requiredFiles > 0, true);
  assert.equal(report.counts.referenceRules > 0, true);
});
