import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  aggregateEvolutionReceiptTrialResults,
  aggregateEvolutionTrialResults,
  collectEvolutionTrialReceiptFailures,
} from './aiGovernanceEvolutionTrialReceiptContract.mjs';
import {
  aggregateEvolutionReceiptTrialResults as aggregateReceiptFromLedgerFacade,
  aggregateEvolutionTrialResults as aggregateTrialsFromLedgerFacade,
} from './aiGovernanceEvolutionTrialReceipts.mjs';

const FIXED_DATE = '2026-07-30';

const buildReceipt = overrides => ({
  schemaVersion: 1,
  id: 'receipt-contract-one',
  artifactType: 'ai-evolution-trial-receipt',
  dataClass: 'redacted',
  caseId: 'rule-read-before-write',
  corpusVersion: '1.1.0',
  caseVersion: 1,
  subjectVersion: '2026-07-10',
  evaluatedAt: FIXED_DATE,
  method: 'human',
  source: 'manual',
  runner: 'human-review',
  revision: 'a'.repeat(40),
  aggregation: 'all-pass',
  trialResults: [{
    trial: 1,
    verdict: 'pass',
    score: 100,
    gradeTarget: 'both',
    evidence: '脱敏人工评审通过',
  }],
  validations: [{
    command: 'node --test scripts/ci/example.test.mjs',
    status: 'passed',
    evidence: '固定验证通过',
    checkedAt: FIXED_DATE,
  }],
  ...overrides,
});

test('trial receipt contract 独立校验单条 v1 receipt 与聚合语义', () => {
  const receipt = buildReceipt();

  assert.equal(aggregateTrialsFromLedgerFacade, aggregateEvolutionTrialResults);
  assert.equal(aggregateReceiptFromLedgerFacade, aggregateEvolutionReceiptTrialResults);
  assert.deepEqual(collectEvolutionTrialReceiptFailures(receipt, {
    index: 0,
    maxDate: FIXED_DATE,
  }).failures, []);
  assert.deepEqual(aggregateEvolutionTrialResults(receipt.trialResults), {
    verdict: 'pass',
    score: 100,
  });
});

test('trial receipt contract 拒绝开放字段、低分 pass 与 validation 漂移', () => {
  const receipt = buildReceipt({
    rawPrompt: 'redacted',
    trialResults: [{
      trial: 1,
      verdict: 'pass',
      score: 59,
      gradeTarget: 'both',
      evidence: '低分却自报通过',
    }],
  });
  receipt.validations[0].checkedAt = '2026-07-29';

  const result = collectEvolutionTrialReceiptFailures(receipt, {
    index: 0,
    maxDate: FIXED_DATE,
  });

  assert.match(result.failures.join('\n'), /rawPrompt 不在允许字段中/);
  assert.match(result.failures.join('\n'), /pass score 不能低于 60/);
  assert.match(result.failures.join('\n'), /checkedAt 必须等于 receipt evaluatedAt/);
});
