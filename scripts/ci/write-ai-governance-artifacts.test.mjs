import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
    const governanceArtifact = JSON.parse(fs.readFileSync(result.files.governance, 'utf8'));
    const scorecardArtifact = JSON.parse(fs.readFileSync(result.files.scorecard, 'utf8'));
    const { generatedAt: scorecardGeneratedAt, ...scorecardWithoutGeneratedAt } = scorecardArtifact;
    assert.deepEqual([
      result.generatedAt,
      contextArtifact.generatedAt,
      contextArtifact.project.version,
      scorecardGeneratedAt,
      scorecardArtifact.reportType,
    ], [
      AI_GOVERNANCE_ARTIFACT_GENERATED_AT,
      AI_GOVERNANCE_ARTIFACT_GENERATED_AT,
      '1.8.736',
      AI_GOVERNANCE_ARTIFACT_GENERATED_AT,
      'ai-governance-maturity-scorecard',
    ]);
    assert.equal(JSON.parse(fs.readFileSync(result.files.maintainability, 'utf8')).counts.budgets, 2);
    assert.deepEqual(governanceArtifact.maturityScorecard, scorecardWithoutGeneratedAt);
    assert.deepEqual(contextArtifact.distributionReadiness, governanceArtifact.distributionReadiness);
    assert.equal(scorecardArtifact.schemaVersion, 2);
    assert.match(result.artifacts.summary, /Distribution failures: workspace=0; index=0; HEAD=0; clone-ready=yes/);
    const attestationSubject = JSON.parse(fs.readFileSync(result.files.attestationSubject, 'utf8'));
    const governanceBytes = fs.readFileSync(result.files.governance);
    assert.deepEqual({
      artifactType: attestationSubject.artifactType,
      evidenceScope: attestationSubject.evidenceScope,
      artifactCount: attestationSubject.artifacts.length,
      ledgerCount: attestationSubject.ledgers.length,
      governanceDigest: attestationSubject.artifacts[0].sha256,
      receiptDigest: attestationSubject.ledgers[1].sha256,
      trustBoundary: attestationSubject.trustBoundary,
    }, {
      artifactType: 'ai-governance-attestation-subject',
      evidenceScope: 'component-only',
      artifactCount: 6,
      ledgerCount: 2,
      governanceDigest: createHash('sha256').update(governanceBytes).digest('hex'),
      receiptDigest: createHash('sha256').update(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/trial-receipts.jsonl'))).digest('hex'),
      trustBoundary: {
        status: 'external-identity-required',
        policyAuthority: 'repository-external',
        confirmedCoverageEligible: false,
      },
    });
    assert.equal(fs.readFileSync(path.join(rootDir, 'summary.md'), 'utf8'), result.artifacts.summary);
  });
});
