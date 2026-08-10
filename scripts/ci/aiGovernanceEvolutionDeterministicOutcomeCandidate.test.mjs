import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildEvolutionDeterministicOutcomeCandidates,
  isEvolutionDeterministicPassReusable,
} from './aiGovernanceEvolutionDeterministicOutcomeCandidate.mjs';
import {
  hashEvolutionOutcomeLegacyPrefix,
  hashEvolutionOutcomeV3Line,
} from './aiGovernanceEvolutionOutcomeChain.mjs';
import { hashEvolutionTrialReceiptLine } from './aiGovernanceEvolutionTrialReceipts.mjs';

const CASE_ID = 'mcp-readonly-shell-rejection';
const EVALUATED_AT = '2026-08-10';
const REVISION = `worktree-${'a'.repeat(64)}`;
const descriptor = {
  caseVersion: 3,
  subjectVersion: '0.5.0',
  evidence: ['fallback evidence'],
};
const runnerResult = {
  evidence: ['runner evidence'],
  validations: [{ command: 'node --test fixture.test.mjs', status: 'passed' }],
};

const createInput = () => ({
  selected: [{ caseId: CASE_ID, descriptor }],
  resultsById: new Map([[CASE_ID, runnerResult]]),
  revision: REVISION,
  evaluatedAt: EVALUATED_AT,
  corpusVersion: '1.58.3',
  receiptsBefore: { bytes: Buffer.alloc(0) },
  outcomesBefore: { bytes: Buffer.alloc(0) },
  state: {
    receiptResult: { receipts: [], receiptsById: new Map() },
    outcomeResult: { outcomes: [], validOutcomes: [] },
  },
});

test('deterministic candidate 只从 runner、revision 与双账本尾部派生记录', () => {
  const candidate = buildEvolutionDeterministicOutcomeCandidates(createInput());
  const receipt = JSON.parse(candidate.receiptLines[0]);
  const outcome = JSON.parse(candidate.outcomeLines[0]);

  assert.equal(receipt.id, `receipt-${CASE_ID}-deterministic-v3-${EVALUATED_AT}-s1`);
  assert.equal(outcome.id, `${CASE_ID}-deterministic-v3-${EVALUATED_AT}-s1`);
  assert.equal(receipt.revision, REVISION);
  assert.equal(outcome.provenance.revision, REVISION);
  assert.equal(receipt.trialResults[0].evidence, 'runner evidence');
  assert.equal(outcome.chain.previousHash, hashEvolutionOutcomeLegacyPrefix([]));
  assert.equal(outcome.evidence.sha256, hashEvolutionTrialReceiptLine(candidate.receiptLines[0]));
  assert.deepEqual(candidate.cases, [{
    caseId: CASE_ID,
    status: 'candidate',
    receiptId: receipt.id,
    outcomeId: outcome.id,
    sequence: 1,
  }]);
  assert.equal(candidate.receiptSuffix.toString('utf8'), `${candidate.receiptLines[0]}\n`);
  assert.equal(candidate.outcomeSuffix.toString('utf8'), `${candidate.outcomeLines[0]}\n`);
});

test('deterministic candidate 只接续同 lineage 直接前序', () => {
  const input = createInput();
  const previous = {
    schemaVersion: 3,
    id: 'previous-fail',
    caseId: CASE_ID,
    caseVersion: descriptor.caseVersion,
    subjectVersion: descriptor.subjectVersion,
    verdict: 'fail',
  };
  const previousLine = JSON.stringify(previous);
  input.state.outcomeResult.outcomes = [previous];
  input.state.outcomeResult.validOutcomes = [previous];
  input.outcomesBefore.bytes = Buffer.from(previousLine, 'utf8');
  const candidate = buildEvolutionDeterministicOutcomeCandidates(input);
  const outcome = JSON.parse(candidate.outcomeLines[0]);

  assert.equal(outcome.chain.sequence, 2);
  assert.equal(outcome.chain.previousHash, hashEvolutionOutcomeV3Line(previousLine));
  assert.equal(outcome.supersession.previousOutcomeId, previous.id);
  assert.equal(outcome.supersession.feedbackDisposition, 'resolved');
  assert.equal(candidate.outcomeSuffix.toString('utf8'), `\n${candidate.outcomeLines[0]}\n`);
});

test('deterministic candidate 复用只接受同 revision 的有效 pass receipt', () => {
  const previous = {
    schemaVersion: 3,
    verdict: 'pass',
    provenance: { method: 'deterministic', runner: 'ai-evolution-case-runner', revision: REVISION },
    evidence: { receiptId: 'receipt-current' },
  };
  assert.equal(isEvolutionDeterministicPassReusable({
    previous,
    revision: REVISION,
    receiptsById: new Map([['receipt-current', {}]]),
  }), true);
  assert.equal(isEvolutionDeterministicPassReusable({
    previous,
    revision: `worktree-${'b'.repeat(64)}`,
    receiptsById: new Map([['receipt-current', {}]]),
  }), false);
});
