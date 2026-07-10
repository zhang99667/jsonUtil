import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { withAiGovernanceTempRoot } from './aiGovernanceTestFixtures.mjs';
import { writeAiGovernanceArtifacts } from './write-ai-governance-artifacts.mjs';
import {
  AI_GOVERNANCE_ARTIFACT_GENERATED_AT,
  createAiGovernanceArtifactRunReport,
  prepareAiGovernanceArtifactProject,
} from './writeAiGovernanceArtifactTestFixtures.mjs';

test('write AI governance JSON artifacts from fixed reports', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareAiGovernanceArtifactProject(rootDir);
    const calls = [];

    const result = writeAiGovernanceArtifacts({
      rootDir,
      outDir: 'tmp-artifacts',
      summaryFile: path.join(rootDir, 'summary.md'),
      top: 2,
      contextTop: 1,
      now: () => new Date(AI_GOVERNANCE_ARTIFACT_GENERATED_AT),
      runReport: createAiGovernanceArtifactRunReport(calls),
    });

    assert.equal(result.ok, true);
    assert.deepEqual(calls.map(([script]) => script), ['scripts/ci/check-ai-governance.mjs', 'scripts/ci/check-maintainability-budgets.mjs']);
    const contextArtifact = JSON.parse(fs.readFileSync(result.files.context, 'utf8'));
    const scorecardArtifact = JSON.parse(fs.readFileSync(result.files.scorecard, 'utf8'));
    assert.deepEqual([
      result.generatedAt,
      contextArtifact.generatedAt,
      contextArtifact.project.version,
      scorecardArtifact.generatedAt,
      scorecardArtifact.reportType,
    ], [
      AI_GOVERNANCE_ARTIFACT_GENERATED_AT,
      AI_GOVERNANCE_ARTIFACT_GENERATED_AT,
      '1.8.736',
      AI_GOVERNANCE_ARTIFACT_GENERATED_AT,
      'ai-governance-maturity-scorecard',
    ]);
    assert.equal(JSON.parse(fs.readFileSync(result.files.maintainability, 'utf8')).counts.budgets, 2);
    assert.equal(fs.readFileSync(path.join(rootDir, 'summary.md'), 'utf8'), result.artifacts.summary);
  });
});
