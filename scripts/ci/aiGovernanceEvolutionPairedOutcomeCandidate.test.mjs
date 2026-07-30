import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hashEvolutionOutcomeLegacyPrefix,
  hashEvolutionOutcomeV3Line,
} from './aiGovernanceEvolutionOutcomeChain.mjs';
import { buildEvolutionPairedOutcomeCandidate } from './aiGovernanceEvolutionPairedOutcomeCandidate.mjs';

const EVALUATED_AT = '2026-07-30';
const REVISION = `worktree-${'a'.repeat(64)}`;

const createInput = (aggregate = { verdict: 'pass', score: 100 }) => ({
  verification: {
    batch: {
      experimentRef: { id: 'skill-triggering-paired-v1' },
      caseRef: { id: 'skill-triggering', caseVersion: 2, subjectVersion: '1.0.0' },
      fixtureRef: { id: 'skill-triggering-validation', sha256: 'b'.repeat(64) },
      environmentRef: { id: 'linux-protected', sha256: 'c'.repeat(64) },
      policyRef: { id: 'observable-trace-v1', version: '1.0.0', sha256: 'd'.repeat(64) },
      rubricSha256: 'e'.repeat(64),
      assignment: { schemaVersion: 1, proofSha256: 'f'.repeat(64) },
      checkpoint: { schemaVersion: 1, proofSha256: '1'.repeat(64) },
      trialResults: [{ trialId: 'trial-1' }],
      proof: { schemaVersion: 1, proofSha256: '2'.repeat(64) },
    },
    aggregate,
    context: {
      caseItem: {
        id: 'skill-triggering',
        caseVersion: 2,
        subject: { version: '1.0.0' },
      },
    },
  },
  evaluatedAt: EVALUATED_AT,
  corpusVersion: '1.60.0',
  revision: REVISION,
  state: {
    receiptResult: { receiptsById: new Map() },
    outcomeResult: { outcomes: [], validOutcomes: [] },
  },
  receiptsBefore: { bytes: Buffer.alloc(0) },
  outcomesBefore: { bytes: Buffer.alloc(0) },
});

test('paired candidate 只从验证结果、当前 revision 与账本尾部派生双记录', () => {
  const input = createInput();
  const candidate = buildEvolutionPairedOutcomeCandidate(input);

  assert.equal(candidate.receipt.id, 'receipt-skill-triggering-paired-v2-2026-07-30-s1');
  assert.equal(candidate.outcome.id, 'skill-triggering-paired-v2-2026-07-30-s1');
  assert.equal(candidate.receipt.revision, REVISION);
  assert.equal(candidate.outcome.provenance.revision, REVISION);
  assert.deepEqual(candidate.receipt.assignment, input.verification.batch.assignment);
  assert.notEqual(candidate.receipt.assignment, input.verification.batch.assignment);
  assert.equal(candidate.outcome.verdict, 'pass');
  assert.equal(candidate.outcome.score, 100);
  assert.equal(candidate.outcome.provenance.trials, 3);
  assert.equal(candidate.outcome.chain.sequence, 1);
  assert.equal(candidate.outcome.chain.previousHash, hashEvolutionOutcomeLegacyPrefix([]));
  assert.equal(candidate.outcome.supersession.previousOutcomeId, null);
  assert.equal(candidate.receiptSuffix.toString('utf8'), `${candidate.receiptLine}\n`);
  assert.equal(candidate.outcomeSuffix.toString('utf8'), `${candidate.outcomeLine}\n`);
});

test('paired candidate 失败聚合只生成有界反馈，不接受 caller 候选字段', () => {
  const input = createInput({ verdict: 'fail', score: 0 });
  const previous = {
    schemaVersion: 3,
    id: 'skill-triggering-paired-v2-previous',
    caseId: 'skill-triggering',
    caseVersion: 2,
    subjectVersion: '1.0.0',
    verdict: 'partial',
  };
  const previousLine = JSON.stringify(previous);
  input.state.outcomeResult.outcomes = [previous];
  input.state.outcomeResult.validOutcomes = [previous];
  input.outcomesBefore.bytes = Buffer.from(previousLine, 'utf8');
  input.verification.batch.verdict = 'pass';
  input.verification.batch.score = 100;
  input.verification.batch.revision = 'caller-revision';
  const candidate = buildEvolutionPairedOutcomeCandidate(input);

  assert.equal(candidate.outcome.verdict, 'fail');
  assert.equal(candidate.outcome.score, 0);
  assert.equal(candidate.outcome.provenance.revision, REVISION);
  assert.match(candidate.outcome.feedback, /fail\/0/);
  assert.equal(candidate.outcome.chain.sequence, 2);
  assert.equal(candidate.outcome.chain.previousHash, hashEvolutionOutcomeV3Line(previousLine));
  assert.equal(candidate.outcome.supersession.previousOutcomeId, previous.id);
  assert.equal(candidate.outcome.supersession.feedbackDisposition, 'open');
  assert.equal(candidate.outcomeSuffix.toString('utf8'), `\n${candidate.outcomeLine}\n`);
});
