import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import { toAiGovernanceJsonReport } from './aiGovernanceCliOutput.mjs';

test('AI 治理 CLI 支持 JSON 摘要输出', () => {
  const result = spawnSync(process.execPath, ['scripts/ci/check-ai-governance.mjs', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  const report = JSON.parse(result.stdout);

  assert.equal(result.status, report.ok ? 0 : 1);
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.reportType, 'ai-governance');
  assert.equal(report.counts.missingFiles, 0);
  assert.equal(report.counts.skillContractFailures, 0);
  assert.equal(report.counts.missingReferences, 0);
  assert.equal(report.failures.missingFiles.length, 0);
  assert.equal(report.counts.contractFailures, report.failures.contractFailures.length);
  assert.equal(report.counts.evolutionEvidenceFailures, report.failures.evolutionEvidenceFailures.length);
  assert.equal(report.failures.contractFailures.some(item => item.includes('revision 未绑定当前 worktree manifest')), false);
  assert.equal(report.counts.requiredFiles > 0, true);
  assert.equal(report.counts.referenceRules > 0, true);
  assert.equal(report.distributionReadiness.reportType, 'ai-asset-distribution-readiness');
  assert.equal(report.distributionReadiness.counts.assets > 0, true);
  const dimension = report.maturityScorecard.dimensions.find(item => item.id === 'distribution-readiness');
  assert.equal(dimension.details.distributionReadiness.assetCount, report.distributionReadiness.counts.assets);
  assert.equal(dimension.details.distributionReadiness.stabilityStatus, report.distributionReadiness.stability.status);
});

test('AI 治理 CLI JSON 会分开输出契约与评测证据失败', () => {
  const report = toAiGovernanceJsonReport({
    requiredFiles: ['AGENTS.md'],
    referenceRules: [{ file: 'AGENTS.md' }],
    missingFiles: [],
    skillContractFailures: [],
    contractFailures: [],
    evolutionEvidenceFailures: ['AI evolution evidence: revision stale'],
    missingReferences: [],
  });

  assert.equal(report.ok, false);
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.reportType, 'ai-governance');
  assert.equal(report.counts.contractFailures, 0);
  assert.equal(report.counts.evolutionEvidenceFailures, 1);
  assert.equal(report.counts.missingReferences, 0);
  assert.deepEqual(report.failures.contractFailures, []);
  assert.deepEqual(report.failures.evolutionEvidenceFailures, ['AI evolution evidence: revision stale']);
  assert.deepEqual(report.failures.missingReferences, []);
  assert.equal(report.distributionReadiness, null);
});
