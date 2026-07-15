import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildEvolutionNextFocus,
  countEvolutionVerdicts,
} from './aiGovernanceEvolutionEvalFocus.mjs';

const cleanFocusInput = overrides => ({
  contractFailures: [],
  currentRunFailures: [],
  currentRunIssues: [],
  evidenceFreshness: { status: 'fresh' },
  currentRunVerifiedCaseIds: [],
  outcomes: [{ caseId: 'recorded-a', verdict: 'pass' }],
  unverifiedOutcomes: [],
  traceBoundUnverifiedOutcomes: [],
  uncoveredCaseIds: [],
  tracePolicyCaseIds: [],
  ledgerChain: { status: 'pass' },
  ...overrides,
});

const assertFocus = (input, id, caseIds) => {
  const focus = buildEvolutionNextFocus(input);
  assert.deepEqual(Object.keys(focus), ['id', 'nextAction', 'caseIds']);
  assert.equal(focus.id, id);
  assert.match(focus.nextAction, /\S/u);
  assert.deepEqual(focus.caseIds, caseIds);
};

test('eval focus 保留 verdict 计数与 legacy failures fallback', () => {
  assert.equal(countEvolutionVerdicts([
    { verdict: 'pass' }, { verdict: 'fail' }, { verdict: 'pass' },
  ], 'pass'), 2);
  assert.deepEqual(buildEvolutionNextFocus({
    failures: ['legacy contract failure'],
    currentRunFailures: [],
    currentRunIssues: [],
    outcomes: [],
    unverifiedOutcomes: [],
    uncoveredCaseIds: [],
  }), {
    id: 'repair-eval-contract',
    nextAction: 'legacy contract failure',
    caseIds: [],
  });
});

test('eval focus 锁定 contract 到 maintain 的完整优先级链', () => {
  let input = cleanFocusInput({
    contractFailures: ['contract failure'],
    currentRunFailures: ['current run failure'],
    currentRunIssues: [
      { caseId: 'delivery-case', failureClass: 'delivery-blocked', reasonCode: 'delivery-blocked' },
      { caseId: 'component-case', failureClass: 'component-fail', reasonCode: 'component-failed' },
      { caseId: 'behavior-case', failureClass: 'behavior-fail', reasonCode: 'behavior-failed' },
      { caseId: 'infrastructure-case', failureClass: 'infrastructure-invalid', reasonCode: 'runner-infrastructure' },
    ],
    evidenceFreshness: { status: 'stale' },
    currentRunVerifiedCaseIds: ['fresh-a', 'fresh-b', 'fresh-c', 'fresh-d'],
    outcomes: [
      { caseId: 'weak-a', verdict: 'fail' },
      { caseId: 'weak-a', verdict: 'partial' },
      { caseId: 'weak-b', verdict: 'fail' },
      { caseId: 'weak-c', verdict: 'partial' },
      { caseId: 'weak-d', verdict: 'fail' },
    ],
    traceBoundUnverifiedOutcomes: [
      { caseId: 'trace-a' }, { caseId: 'trace-a' }, { caseId: 'trace-b' }, { caseId: 'trace-c' }, { caseId: 'trace-d' },
    ],
    unverifiedOutcomes: [
      { caseId: 'unverified-a' }, { caseId: 'unverified-a' }, { caseId: 'unverified-b' }, { caseId: 'unverified-c' },
    ],
    uncoveredCaseIds: ['plain-a', 'policy-a', 'plain-b', 'policy-b'],
    tracePolicyCaseIds: ['policy-a', 'policy-b'],
    ledgerChain: { status: 'unknown' },
  });

  assertFocus(input, 'repair-eval-contract', []);
  input = { ...input, contractFailures: [] };
  assertFocus(input, 'repair-fixed-runner-infrastructure', ['infrastructure-case']);
  input = { ...input, currentRunIssues: input.currentRunIssues.slice(0, 3) };
  assertFocus(input, 'repair-current-deterministic-run', ['behavior-case']);
  input = { ...input, currentRunIssues: input.currentRunIssues.slice(0, 2) };
  assertFocus(input, 'repair-current-component-run', ['component-case']);
  input = { ...input, currentRunIssues: input.currentRunIssues.slice(0, 1) };
  assertFocus(input, 'complete-project-delivery-evidence', ['delivery-case']);
  input = { ...input, currentRunIssues: [] };
  assertFocus(input, 'repair-current-deterministic-run', []);
  input = { ...input, currentRunFailures: [] };
  assertFocus(input, 'refresh-stale-deterministic-evidence', ['fresh-a', 'fresh-b', 'fresh-c']);
  input = { ...input, evidenceFreshness: { status: 'fresh' } };
  assert.deepEqual(buildEvolutionNextFocus(input), {
    id: 'address-outcome-feedback',
    nextAction: '先处理 fail/partial 的 feedback，再决定是否回写规则或 skill',
    caseIds: ['weak-a', 'weak-b', 'weak-c'],
  });
  input = { ...input, outcomes: [{ caseId: 'recorded-a', verdict: 'pass' }] };
  assertFocus(input, 'verify-agent-trace', ['trace-a', 'trace-b', 'trace-c']);
  input = { ...input, traceBoundUnverifiedOutcomes: [], outcomes: [] };
  assertFocus(input, 'verify-nondeterministic-outcome', ['unverified-a', 'unverified-b', 'unverified-c']);
  input = { ...input, unverifiedOutcomes: [] };
  assert.deepEqual(buildEvolutionNextFocus(input), {
    id: 'record-first-outcomes',
    nextAction: '按真实执行结果记录首批 outcome，不补造历史成绩',
    caseIds: ['policy-a', 'policy-b', 'plain-a'],
  });
  input = { ...input, outcomes: [{ caseId: 'recorded-a', verdict: 'pass' }] };
  assertFocus(input, 'establish-outcome-chain', ['recorded-a']);
  input = { ...input, ledgerChain: { status: 'pass' } };
  assertFocus(input, 'increase-outcome-coverage', ['policy-a', 'policy-b', 'plain-a']);
  input = { ...input, uncoveredCaseIds: [] };
  assert.deepEqual(buildEvolutionNextFocus(input), {
    id: 'maintain-eval-signal',
    nextAction: '保持真实 outcome 记录，并定期复核 corpus 代表性',
    caseIds: [],
  });
});
