import assert from 'node:assert/strict';
import { test } from 'node:test';

import { replayEvolutionDeterministicOutcomes } from './aiGovernanceEvolutionOutcomeReplay.mjs';

const REVISION = 'worktree-current';
const validation = (command = 'node --test fixture.test.mjs', status = 'passed') => ({ command, status });
const makeOutcome = ({
  id = 'fixed-outcome', caseId = id, revision = REVISION, verdict = 'pass', schemaVersion = 3,
  method = 'deterministic', receiptId = `${id}-receipt`,
} = {}) => ({
  schemaVersion, id, caseId, caseVersion: 1, subjectVersion: '1.0.0', verdict,
  provenance: { method, revision }, evidence: { receiptId },
});
const makeReceipt = (overrides = {}) => ({
  schemaVersion: 1, validations: [validation()], ...overrides,
});
const makeResult = (outcome, overrides = {}) => ({
  caseId: outcome.caseId, caseVersion: outcome.caseVersion, subjectVersion: outcome.subjectVersion,
  status: outcome.verdict === 'pass' ? 'passed' : 'failed',
  outcomeEligible: outcome.verdict === 'pass', validations: [validation()], ...overrides,
});
const receiptsFor = outcomes => new Map(outcomes.map(outcome => [
  outcome.evidence.receiptId, { receipt: makeReceipt() },
]));
const replay = ({ outcomes = [makeOutcome()], receiptsById = receiptsFor(outcomes),
  resolveRevision = () => REVISION, runCases = ({ caseIds }) => ({
    results: caseIds.map(caseId => makeResult(outcomes.find(outcome => outcome.caseId === caseId))),
  }) } = {}) => replayEvolutionDeterministicOutcomes({
  rootDir: '/unused', outcomes, receiptsById, resolveRevision, runCases,
});

test('fixed replay 只选择 schema v2+、deterministic 与 receipt v1 的交集', () => {
  const legacy = makeOutcome({ id: 'legacy', schemaVersion: 1 });
  const model = makeOutcome({ id: 'model', method: 'model' });
  const trace = makeOutcome({ id: 'trace' });
  const receiptsById = receiptsFor([legacy, model, trace]);
  receiptsById.get(trace.evidence.receiptId).receipt.schemaVersion = 2;
  const result = replay({
    outcomes: [legacy, model, trace], receiptsById,
    resolveRevision: () => assert.fail('空交集不应解析 revision'),
    runCases: () => assert.fail('空交集不应运行 fixed runner'),
  });
  assert.deepEqual(result, {
    verifiedOutcomeIds: new Set(), currentRunVerifiedOutcomeIds: new Set(),
    failures: [], currentRunIssues: [], evidenceFreshness: {
      status: 'not-applicable', staleOutcomeIds: [], staleCaseIds: [], failures: [],
    },
  });
});

test('fixed replay 保留 case 首见顺序、去重运行并分离 fresh 与 stale 通过项', () => {
  const fresh = makeOutcome({ id: 'fresh', caseId: 'shared-case' });
  const stale = makeOutcome({ id: 'stale', caseId: 'shared-case', revision: 'worktree-old' });
  const failed = makeOutcome({ id: 'failed-verdict', caseId: 'failed-case', verdict: 'fail' });
  const outcomes = [fresh, stale, failed];
  const receiptsById = receiptsFor(outcomes);
  receiptsById.forEach(entry => { entry.receipt.validations[0].durationMs = 9; });
  let selectedCaseIds;
  const result = replay({
    outcomes, receiptsById,
    runCases: ({ caseIds }) => {
      selectedCaseIds = caseIds;
      return { results: [
        makeResult(fresh, { validations: [{ ...validation(), diagnostic: 'ignored' }] }),
        makeResult(failed, { outcomeEligible: false }),
      ] };
    },
  });
  assert.deepEqual(selectedCaseIds, ['shared-case', 'failed-case']);
  assert.deepEqual([...result.verifiedOutcomeIds], ['fresh', 'failed-verdict']);
  assert.deepEqual([...result.currentRunVerifiedOutcomeIds], ['stale']);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.currentRunIssues, []);
  assert.deepEqual(result.evidenceFreshness, {
    status: 'stale', staleOutcomeIds: ['stale'], staleCaseIds: ['shared-case'],
    failures: ['outcomes.jsonl: outcome `stale` revision 未绑定当前 worktree manifest'],
  });
});

test('revision 不可解析时阻断 runner，并投影 unavailable freshness', () => {
  const result = replay({
    resolveRevision: () => { throw new Error('revision-unavailable'); },
    runCases: () => assert.fail('revision 失败不应运行 fixed runner'),
  });
  assert.deepEqual(result.failures, ['deterministic outcome revision 校验失败：revision-unavailable']);
  assert.deepEqual(result.currentRunIssues, []);
  assert.deepEqual(result.evidenceFreshness, {
    status: 'unavailable', staleOutcomeIds: [], staleCaseIds: [], failures: [],
  });
});

test('runner 抛错固定投影为 infrastructure-invalid，不回显异常正文', () => {
  const result = replay({ runCases: () => { throw new Error('sensitive-runner-detail'); } });
  assert.deepEqual(result.failures, ['deterministic outcome 即时重放失败：fixed-runner-threw']);
  assert.deepEqual(result.currentRunIssues, [{
    failureClass: 'infrastructure-invalid', reasonCode: 'fixed-runner-threw',
    diagnostic: 'fixed runner command failed: fixed-runner-threw',
  }]);
  assert.equal(JSON.stringify(result).includes('sensitive-runner-detail'), false);
});

test('缺少 result 或 runner 期间丢失 receipt 都使用固定 binding 失败', () => {
  const scenarios = [
    ['missing-result', ({ outcome }) => ({ results: [] })],
    ['missing-receipt', ({ outcome, receiptsById }) => {
      receiptsById.delete(outcome.evidence.receiptId);
      return { results: [makeResult(outcome)] };
    }],
  ];
  scenarios.forEach(([id, buildReplay]) => {
    const outcome = makeOutcome({ id });
    const receiptsById = receiptsFor([outcome]);
    const result = replay({ outcomes: [outcome], receiptsById,
      runCases: () => buildReplay({ outcome, receiptsById }) });
    assert.deepEqual(result.failures, [`outcomes.jsonl: outcome \`${id}\` 缺少可重放 result 或 receipt`]);
    assert.deepEqual(result.currentRunIssues, [{
      caseId: id, outcomeId: id, failureClass: 'infrastructure-invalid',
      reasonCode: 'fixed-replay-binding-missing',
      diagnostic: 'fixed runner replay failed: fixed-replay-binding-missing',
    }]);
  });
});

test('case、subject、status、eligibility 与 validation 任一漂移都拒绝重放', () => {
  const mutations = [
    ['case-version', result => ({ ...result, caseVersion: 2 })],
    ['subject-version', result => ({ ...result, subjectVersion: '2.0.0' })],
    ['status', result => ({ ...result, status: 'failed' })],
    ['eligibility', result => ({ ...result, outcomeEligible: false })],
    ['validation-command', result => ({ ...result, validations: [validation('node --test other.test.mjs')] })],
    ['validation-status', result => ({ ...result, validations: [validation(undefined, 'failed')] })],
    ['validations-missing', result => ({ ...result, validations: undefined })],
  ];
  mutations.forEach(([id, mutate]) => {
    const outcome = makeOutcome({ id });
    const result = replay({ outcomes: [outcome], runCases: () => ({ results: [mutate(makeResult(outcome))] }) });
    assert.deepEqual(result.failures, [
      `outcomes.jsonl: outcome \`${id}\` 未通过固定 runner 即时重放或 receipt 精确比对 (infrastructure-invalid/fixed-replay-result-mismatch)`,
    ]);
    assert.deepEqual(result.currentRunIssues, [{
      caseId: id, outcomeId: id, failureClass: 'infrastructure-invalid',
      reasonCode: 'fixed-replay-result-mismatch',
      diagnostic: 'fixed runner replay failed: fixed-replay-result-mismatch',
    }]);
  });
});

test('runner 四类闭字段失败按 outcome 顺序原样传播', () => {
  const classified = [
    ['behavior-mismatch', 'behavior-fail', 'fixed-command-assertion-failed'],
    ['component-mismatch', 'component-fail', 'fixed-component-assertion-failed'],
    ['delivery-mismatch', 'delivery-blocked', 'project-index-not-ready'],
    ['infrastructure-mismatch', 'infrastructure-invalid', 'fixed-runner-timeout'],
  ];
  const outcomes = classified.map(([id]) => makeOutcome({ id }));
  const results = outcomes.map((outcome, index) => makeResult(outcome, {
    status: 'failed', outcomeEligible: false, failureClass: classified[index][1],
    reasonCode: classified[index][2], diagnostic: classified[index][2],
  }));
  const result = replay({ outcomes, runCases: () => ({ results }) });
  assert.deepEqual(result.failures, classified.map(([id, failureClass, reasonCode]) => (
    `outcomes.jsonl: outcome \`${id}\` 未通过固定 runner 即时重放或 receipt 精确比对 (${failureClass}/${reasonCode})`
  )));
  assert.deepEqual(result.currentRunIssues, classified.map(([id, failureClass, reasonCode]) => ({
    caseId: id, outcomeId: id, failureClass, reasonCode, diagnostic: reasonCode,
  })));
});
