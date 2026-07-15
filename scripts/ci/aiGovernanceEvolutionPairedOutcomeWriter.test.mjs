import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  batchProjectionFromReceipt,
  prepareEvolutionPairedOutcome,
  recordEvolutionPairedOutcome,
} from './aiGovernanceEvolutionPairedOutcomeWriter.mjs';
import { hashEvolutionPairedGrade } from './aiGovernanceEvolutionPairedReceiptV4Proof.mjs';
import {
  buildEvolutionPairedBatchFixture,
  resignEvolutionPairedBatchFixture,
} from './aiGovernanceEvolutionPairedReceiptV4TestFixtures.mjs';
import { syncTracePolicyFixture } from './aiGovernanceTestFixtures.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EVALUATED_AT = '2026-07-15';

const createProject = (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-paired-writer-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  for (const relative of [
    'evals/ai-governance/cases.json',
    'evals/ai-governance/experiments.json',
    '.agents/skills/jsonutils-ai-infra-evolver/evals/evals.json',
  ]) {
    const destination = path.join(rootDir, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, relative), destination);
  }
  syncTracePolicyFixture(rootDir, sourceRoot, { copyRequiredReads: true });
  for (const relative of [
    'evals/ai-governance/trial-receipts.jsonl',
    'evals/ai-governance/outcomes.jsonl',
  ]) fs.writeFileSync(path.join(rootDir, relative), '', { mode: 0o600 });
  return rootDir;
};

test('paired writer 不把 caller Map 数学验签升级为 behavior candidate', (t) => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir: sourceRoot });
  assert.deepEqual(batchProjectionFromReceipt(fixture.batch), fixture.batch);
  const rootDir = createProject(t);
  const receiptsPath = path.join(rootDir, 'evals/ai-governance/trial-receipts.jsonl');
  const outcomesPath = path.join(rootDir, 'evals/ai-governance/outcomes.jsonl');
  const before = [fs.readFileSync(receiptsPath), fs.readFileSync(outcomesPath)];
  const prepared = prepareEvolutionPairedOutcome({
    rootDir,
    batch: fixture.batch,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
    evaluatedAt: EVALUATED_AT,
    resolveRevision: () => fixture.context.revision,
  });

  assert.equal(prepared.report.status, 'proof-unverified');
  assert.equal(prepared.report.proofStatus, 'signature-verified-unwitnessed');
  assert.equal(prepared.report.confirmedCoverageEligible, false);
  assert.equal(prepared.transaction.receiptSuffix.length, 0);
  assert.equal(prepared.transaction.outcomeSuffix.length, 0);
  assert.deepEqual([fs.readFileSync(receiptsPath), fs.readFileSync(outcomesPath)], before);
});

test('普通项目调用没有外部 trust root 时只能 preview unverified，零 ledger suffix', (t) => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir: sourceRoot });
  const prepared = prepareEvolutionPairedOutcome({
    rootDir: createProject(t),
    batch: fixture.batch,
    evaluatedAt: EVALUATED_AT,
    resolveRevision: () => fixture.context.revision,
  });
  assert.equal(prepared.report.status, 'proof-unverified');
  assert.equal(prepared.report.proofStatus, 'unverified');
  assert.equal(prepared.report.confirmedCoverageEligible, false);
  assert.equal(prepared.transaction.receiptSuffix.length, 0);
  assert.equal(prepared.transaction.outcomeSuffix.length, 0);
});

test('基础设施无效批次不写 receipt-only orphan', (t) => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir: sourceRoot });
  const trial = fixture.batch.trialResults[0];
  trial.execution.retryCount = 1;
  trial.infrastructure = { status: 'invalid', reasonCodes: ['retry-detected'] };
  trial.grade = {
    status: 'ungradable', verdict: null, score: null, reasonCodes: ['retry-detected'],
  };
  trial.gradeSha256 = hashEvolutionPairedGrade(trial.grade);
  resignEvolutionPairedBatchFixture(fixture.batch, fixture.signers);
  const prepared = prepareEvolutionPairedOutcome({
    rootDir: createProject(t),
    batch: fixture.batch,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
    evaluatedAt: EVALUATED_AT,
    resolveRevision: () => fixture.context.revision,
  });
  assert.equal(prepared.report.status, 'infrastructure-invalid');
  assert.equal(prepared.transaction.receiptSuffix.length, 0);
  assert.equal(prepared.transaction.outcomeSuffix.length, 0);
});

test('write 在 CI 先于 lock 拒绝，本地缺受保护授权时也不触发 recovery', (t) => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir: sourceRoot });
  const rootDir = createProject(t);
  let acquired = false;
  assert.throws(() => recordEvolutionPairedOutcome({
    rootDir,
    batch: fixture.batch,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
    write: true,
    env: { CI: '1' },
    evaluatedAt: EVALUATED_AT,
    resolveRevision: () => fixture.context.revision,
    transactionApi: {
      acquire: () => { acquired = true; }, recover: () => ({}), commit: () => ({}),
    },
  }), /CI\/GitHub Actions/);
  assert.equal(acquired, false);

  acquired = false;
  const report = recordEvolutionPairedOutcome({
    rootDir,
    batch: fixture.batch,
    pairedTrustPolicy: fixture.pairedTrustPolicy,
    write: true,
    env: {},
    evaluatedAt: EVALUATED_AT,
    resolveRevision: () => fixture.context.revision,
    transactionApi: {
      acquire: () => { acquired = true; throw new Error('不应 acquire'); },
      recover: () => { throw new Error('不应 recover'); },
      commit: () => { throw new Error('不应 commit'); },
    },
  });
  assert.equal(report.status, 'proof-unverified');
  assert.equal(report.ledgerMutationPerformed, false);
  assert.equal(report.recovery.status, 'not-attempted-without-protected-authorization');
  assert.equal(acquired, false);
});

test('no-candidate preview 仍拒绝 source 与双 ledger 漂移', (t) => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir: sourceRoot });
  let revisionReads = 0;
  assert.throws(() => prepareEvolutionPairedOutcome({
    rootDir: createProject(t), batch: fixture.batch, evaluatedAt: EVALUATED_AT,
    resolveRevision: () => revisionReads++ === 0 ? fixture.context.revision : 'worktree-'.padEnd(73, '0'),
  }), /source-state v2 revision 发生漂移/);

  for (const [relative, label] of [
    ['evals/ai-governance/trial-receipts.jsonl', 'receipt ledger'],
    ['evals/ai-governance/outcomes.jsonl', 'outcome ledger'],
  ]) {
    const rootDir = createProject(t);
    assert.throws(() => prepareEvolutionPairedOutcome({
      rootDir, batch: fixture.batch, evaluatedAt: EVALUATED_AT,
      resolveRevision: () => fixture.context.revision,
      validateCandidate: () => { fs.appendFileSync(path.join(rootDir, relative), '{}\n'); return {}; },
    }), new RegExp(`${label}.*发生漂移`));
  }
});

test('caller 不能通过 batch 注入 verdict、score、revision 或 chain', (t) => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir: sourceRoot });
  for (const field of ['verdict', 'score', 'revision', 'chain']) {
    assert.throws(() => prepareEvolutionPairedOutcome({
      rootDir: createProject(t),
      batch: { ...fixture.batch, [field]: field === 'score' ? 100 : 'caller-value' },
      pairedTrustPolicy: fixture.pairedTrustPolicy,
      evaluatedAt: EVALUATED_AT,
      resolveRevision: () => fixture.context.revision,
    }), /闭字段/);
  }
});
