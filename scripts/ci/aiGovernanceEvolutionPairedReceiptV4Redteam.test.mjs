import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  AI_EVOLUTION_PAIRED_RUNNER,
  AI_EVOLUTION_PAIRED_VALIDATION_COMMAND,
  AI_EVOLUTION_PAIRED_VALIDATION_EVIDENCE,
  aggregateEvolutionPairedCandidateResults,
  verifyEvolutionPairedBatchArtifact,
} from './aiGovernanceEvolutionPairedReceiptV4.mjs';
import { hashEvolutionPairedGrade } from './aiGovernanceEvolutionPairedReceiptV4Proof.mjs';
import {
  buildEvolutionPairedBatchFixture,
  resignEvolutionPairedBatchFixture,
  resignEvolutionPairedFinalBatchFixture,
} from './aiGovernanceEvolutionPairedReceiptV4TestFixtures.mjs';
import { readEvolutionTrialReceiptLedger } from './aiGovernanceEvolutionTrialReceipts.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const digest = value => value.toString(16).padStart(64, '0').slice(-64);
const verify = fixture => verifyEvolutionPairedBatchArtifact(fixture.batch, {
  rootDir,
  expectedRevision: fixture.context.revision,
  pairedTrustPolicy: fixture.pairedTrustPolicy,
});

const failGrade = () => ({
  status: 'graded', verdict: 'fail', score: 0, reasonCodes: ['rubric-fail'],
});

test('checkpoint 后互换 arm payload 无法保留 pre-execution assignment proof', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  for (const trial of fixture.batch.trialResults.filter(item => item.arm === 'candidate')) {
    trial.grade = failGrade();
    trial.gradeSha256 = hashEvolutionPairedGrade(trial.grade);
  }
  resignEvolutionPairedBatchFixture(fixture.batch, fixture.signers);
  assert.deepEqual(aggregateEvolutionPairedCandidateResults(fixture.batch.trialResults), {
    verdict: 'fail', score: 0, trials: 3,
  });
  const checkpointEnvelope = fixture.batch.proof.checkpointEnvelope;
  const payloadFields = [
    'blindAlias', 'resultSha256', 'gradeSha256', 'infrastructure', 'grade', 'execution', 'trace',
  ];
  for (let index = 0; index < 6; index += 2) {
    for (const field of payloadFields) {
      [fixture.batch.trialResults[index][field], fixture.batch.trialResults[index + 1][field]] = [
        fixture.batch.trialResults[index + 1][field], fixture.batch.trialResults[index][field],
      ];
    }
  }
  resignEvolutionPairedFinalBatchFixture(fixture.batch, fixture.signers);

  assert.equal(fixture.batch.proof.checkpointEnvelope, checkpointEnvelope);
  assert.deepEqual(aggregateEvolutionPairedCandidateResults(fixture.batch.trialResults), {
    verdict: 'pass', score: 100, trials: 3,
  });
  const result = verify(fixture);
  assert.equal(result.componentEligible, false);
  assert.equal(result.scoringEligible, false);
  assert.match(result.failures.join('\n'), /assignment.*arm\/treatment\/blindAlias\/lease\/task mapping/);
});

test('baseline 选中 evolver 是 treatment contamination，整批 infrastructure-invalid', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const baseline = fixture.batch.trialResults.find(item => item.arm === 'baseline');
  const decision = baseline.trace.events.find(item => item.type === 'skill.decision');
  decision.status = 'selected';
  baseline.infrastructure = {
    status: 'invalid', reasonCodes: ['baseline-treatment-invalid'],
  };
  baseline.grade = {
    status: 'ungradable', verdict: null, score: null,
    reasonCodes: ['baseline-treatment-invalid'],
  };
  baseline.gradeSha256 = hashEvolutionPairedGrade(baseline.grade);
  resignEvolutionPairedBatchFixture(fixture.batch, fixture.signers);
  const result = verify(fixture);
  assert.deepEqual(result.failures, []);
  assert.equal(result.infrastructureEligible, false);
  assert.equal(result.aggregate, undefined);
  assert.equal(result.scoringEligible, false);
});

test('baseline 不得通过少读共享必读上下文人为变弱', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const baseline = fixture.batch.trialResults.find(item => item.arm === 'baseline');
  baseline.trace.events = baseline.trace.events
    .filter(item => item.type !== 'context.read')
    .map((item, index) => ({ ...item, sequence: index + 1 }));
  baseline.trace.events.splice(-2, 0, {
    sequence: 0, type: 'context.read', actorId: 'root-agent',
    path: '.agents/skills/jsonutils-ai-infra-evolver/references/secret.md', sha256: digest(992),
  });
  baseline.trace.events.forEach((item, index) => { item.sequence = index + 1; });
  baseline.infrastructure = { status: 'invalid', reasonCodes: ['baseline-treatment-invalid'] };
  baseline.grade = {
    status: 'ungradable', verdict: null, score: null, reasonCodes: ['baseline-treatment-invalid'],
  };
  baseline.gradeSha256 = hashEvolutionPairedGrade(baseline.grade);
  resignEvolutionPairedBatchFixture(fixture.batch, fixture.signers);

  const result = verify(fixture);
  assert.deepEqual(result.failures, []);
  assert.match(result.trialVerifications[0].policyVerification.failures.join('\n'), /精确等于共享 requiredReads/);
  assert.equal(result.infrastructureEligible, false);
  assert.equal(result.aggregate, undefined);
});

test('caller 重签任意 environment/result 只是 signature-bound unwitnessed，永不计分', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  fixture.batch.environmentRef.sha256 = digest(980);
  fixture.batch.environmentRef.manifestSha256 = digest(981);
  const candidate = fixture.batch.trialResults.find(item => item.arm === 'candidate');
  candidate.resultSha256 = digest(982);
  candidate.trace.events.find(item => item.type === 'response.finish').sha256 = candidate.resultSha256;
  resignEvolutionPairedBatchFixture(fixture.batch, fixture.signers);

  const result = verify(fixture);
  assert.deepEqual(result.failures, []);
  assert.equal(result.proofVerification.status, 'signature-verified-unwitnessed');
  assert.equal(result.proofVerification.trustPolicyProtected, false);
  assert.equal(result.environmentBinding.status, 'unavailable');
  assert.equal(result.scoringEligible, false);
});

test('paired assignment nonce 与三段 proof 不得换 receipt id 重放', (t) => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const receiptFor = id => ({
    schemaVersion: 4,
    id,
    artifactType: 'ai-evolution-trial-receipt',
    dataClass: 'redacted',
    caseId: fixture.context.caseItem.id,
    corpusVersion: fixture.context.corpusResult.corpus.corpusVersion,
    caseVersion: fixture.context.caseItem.caseVersion,
    subjectVersion: fixture.context.caseItem.subject.version,
    evaluatedAt: '2026-07-13',
    method: 'hybrid',
    source: 'manual',
    runner: AI_EVOLUTION_PAIRED_RUNNER,
    revision: fixture.context.revision,
    aggregation: 'candidate-only-v1',
    trialResults: structuredClone(fixture.batch.trialResults),
    validations: [{
      command: AI_EVOLUTION_PAIRED_VALIDATION_COMMAND,
      status: 'passed',
      evidence: AI_EVOLUTION_PAIRED_VALIDATION_EVIDENCE,
      checkedAt: '2026-07-13',
    }],
    ...Object.fromEntries([
      'experimentRef', 'caseRef', 'fixtureRef', 'environmentRef', 'policyRef',
      'rubricSha256', 'assignment', 'checkpoint', 'proof',
    ].map(field => [field, structuredClone(fixture.batch[field])])),
  });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-paired-replay-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const ledgerPath = path.join(directory, 'trial-receipts.jsonl');
  const receipts = [receiptFor('paired-replay-one'), receiptFor('paired-replay-two')];
  fixture.batch.assignment.batchNonce = digest(991);
  const candidate = fixture.batch.trialResults.find(item => item.arm === 'candidate');
  candidate.grade = failGrade();
  candidate.gradeSha256 = hashEvolutionPairedGrade(candidate.grade);
  resignEvolutionPairedBatchFixture(fixture.batch, fixture.signers);
  receipts.push(receiptFor('paired-replay-resigned'));
  fs.writeFileSync(ledgerPath, `${receipts.map(JSON.stringify).join('\n')}\n`);

  const result = readEvolutionTrialReceiptLedger(ledgerPath, {
    rootDir, maxDate: '2026-07-15', pairedTrustPolicy: fixture.pairedTrustPolicy,
  });
  assert.match(result.failures.join('\n'), /batchNonce.*重放|proof.*重放/);
  assert.match(result.failures.join('\n'), /semantic execution facts.*重放/);
  assert.equal(result.validReceipts.length, 0);
});
