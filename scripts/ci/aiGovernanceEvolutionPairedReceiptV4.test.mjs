import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  aggregateEvolutionPairedCandidateResults,
  parseEvolutionPairedBatchArtifact,
  verifyEvolutionPairedBatchArtifact,
} from './aiGovernanceEvolutionPairedReceiptV4.mjs';
import { hashEvolutionPairedGrade } from './aiGovernanceEvolutionPairedReceiptV4Proof.mjs';
import {
  buildEvolutionPairedBatchFixture,
  resignEvolutionPairedBatchFixture,
} from './aiGovernanceEvolutionPairedReceiptV4TestFixtures.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('paired v4 精确绑定六次执行、三角色 proof 与 candidate-only 聚合', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const parsed = parseEvolutionPairedBatchArtifact(JSON.stringify(fixture.batch));
  const verified = verifyEvolutionPairedBatchArtifact(parsed, {
    rootDir,
    expectedRevision: fixture.context.revision,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
  });

  assert.deepEqual(verified.failures, []);
  assert.equal(verified.proofVerification.status, 'signature-verified-unwitnessed');
  assert.equal(verified.infrastructureEligible, true);
  assert.equal(verified.componentEligible, true);
  assert.equal(verified.scoringEligible, false);
  assert.deepEqual(verified.aggregate, { verdict: 'pass', score: 100, trials: 3 });

  const withoutTrust = verifyEvolutionPairedBatchArtifact(parsed, {
    rootDir, expectedRevision: fixture.context.revision,
  });
  assert.deepEqual(withoutTrust.failures, []);
  assert.equal(withoutTrust.proofVerification.status, 'unverified');
  assert.equal(withoutTrust.scoringEligible, false);
});

test('baseline 只作比较，不进入 candidate outcome', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  for (const trial of fixture.batch.trialResults.filter(item => item.arm === 'baseline')) {
    trial.grade = { status: 'graded', verdict: 'fail', score: 0, reasonCodes: ['rubric-fail'] };
    trial.gradeSha256 = hashEvolutionPairedGrade(trial.grade);
  }
  resignEvolutionPairedBatchFixture(fixture.batch, fixture.signers);
  const verified = verifyEvolutionPairedBatchArtifact(fixture.batch, {
    rootDir, expectedRevision: fixture.context.revision,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
  });

  assert.deepEqual(verified.failures, []);
  assert.equal(verified.componentEligible, true);
  assert.equal(verified.scoringEligible, false);
  assert.deepEqual(aggregateEvolutionPairedCandidateResults(fixture.batch.trialResults), {
    verdict: 'pass', score: 100, trials: 3,
  });
});

test('任一基础设施失效使整批不可评分，不伪装为 behavior fail', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const trial = fixture.batch.trialResults[0];
  trial.execution.retryCount = 1;
  trial.infrastructure = { status: 'invalid', reasonCodes: ['retry-detected'] };
  trial.grade = {
    status: 'ungradable', verdict: null, score: null, reasonCodes: ['retry-detected'],
  };
  trial.gradeSha256 = hashEvolutionPairedGrade(trial.grade);
  resignEvolutionPairedBatchFixture(fixture.batch, fixture.signers);
  const verified = verifyEvolutionPairedBatchArtifact(fixture.batch, {
    rootDir, expectedRevision: fixture.context.revision,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
  });

  assert.deepEqual(verified.failures, []);
  assert.equal(verified.proofVerification.status, 'signature-verified-unwitnessed');
  assert.equal(verified.infrastructureEligible, false);
  assert.equal(verified.scoringEligible, false);
  assert.equal(verified.aggregate, undefined);
});

test('完整 trace 的 policy 违例是 behavior fail，仍可按候选臂归约', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const trial = fixture.batch.trialResults.find(item => item.arm === 'candidate');
  const requiredPath = fixture.context.policyEntry.policy.requiredReads[0].path;
  trial.trace.events = trial.trace.events
    .filter(event => !(event.type === 'context.read' && event.path === requiredPath))
    .map((event, index) => ({ ...event, sequence: index + 1 }));
  trial.grade = {
    status: 'graded', verdict: 'fail', score: 0, reasonCodes: ['trace-policy-rejected'],
  };
  trial.gradeSha256 = hashEvolutionPairedGrade(trial.grade);
  resignEvolutionPairedBatchFixture(fixture.batch, fixture.signers);
  const verified = verifyEvolutionPairedBatchArtifact(fixture.batch, {
    rootDir, expectedRevision: fixture.context.revision,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
  });

  assert.deepEqual(verified.failures, []);
  assert.equal(verified.componentEligible, true);
  assert.equal(verified.scoringEligible, false);
  assert.deepEqual(verified.aggregate, { verdict: 'partial', score: 67, trials: 3 });
});

test('篡改 grade、trial mapping 或 source revision 均 fail closed', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const gradeTamper = structuredClone(fixture.batch);
  gradeTamper.trialResults[1].grade.score = 0;
  const gradeResult = verifyEvolutionPairedBatchArtifact(gradeTamper, {
    rootDir, expectedRevision: fixture.context.revision,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
  });
  assert.match(gradeResult.failures.join('\n'), /grade|proof|绑定/);

  const mappingTamper = structuredClone(fixture.batch);
  [mappingTamper.trialResults[0].arm, mappingTamper.trialResults[1].arm] = [
    mappingTamper.trialResults[1].arm, mappingTamper.trialResults[0].arm,
  ];
  assert.match(verifyEvolutionPairedBatchArtifact(mappingTamper, {
    rootDir, expectedRevision: fixture.context.revision,
  }).failures.join('\n'), /mapping|plan|绑定/);

  assert.match(verifyEvolutionPairedBatchArtifact(fixture.batch, {
    rootDir, expectedRevision: `worktree-${'0'.repeat(64)}`,
  }).failures.join('\n'), /source-state v2/);
});

test('assignment、checkpoint 与 batch signer 必须 keyid 和真实 SPKI 都隔离', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const shared = { keyid: 'shared-external-key', publicKey, privateKey };
  const fixture = buildEvolutionPairedBatchFixture({
    rootDir, signers: { assignment: shared, checkpoint: shared, batch: shared },
  });
  const verified = verifyEvolutionPairedBatchArtifact(fixture.batch, {
    rootDir, expectedRevision: fixture.context.revision,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
  });
  assert.equal(verified.scoringEligible, false);
  assert.match(verified.failures.join('\n'), /不同 keyid|不同 Ed25519 SPKI/);
});

test('stdin 拒绝 pretty JSON、额外 caller verdict 与超限输入', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  assert.throws(() => parseEvolutionPairedBatchArtifact(
    JSON.stringify(fixture.batch, null, 2),
  ), /精确紧凑 JSON/);
  assert.throws(() => parseEvolutionPairedBatchArtifact(JSON.stringify({
    ...fixture.batch, verdict: 'pass',
  })), /闭字段/);
  assert.throws(() => parseEvolutionPairedBatchArtifact(' '.repeat(512 * 1024 + 1)), /至多/);
});
