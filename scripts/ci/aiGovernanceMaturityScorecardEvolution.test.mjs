import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';

const governanceReport = evolutionEvals => ({
  counts: { requiredFiles: 42, referenceRules: 17 },
  failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
  evolutionEvals: { ledgerChain: { status: 'pass' }, ...evolutionEvals },
});
const behaviorDimension = report => buildAiGovernanceMaturityScorecard({
  governanceReport: governanceReport(report),
  budgetReport: { ok: true, items: { highUsage: [] } },
}).dimensions.find(item => item.id === 'behavior-quality');

test('AI 治理 scorecard 在没有真实 outcome 时保持 unknown', () => {
  const dimension = behaviorDimension({
    ok: true,
    counts: {
      cases: 19, behaviorCases: 15, componentBoundaryCases: 4,
      outcomes: 0, pass: 0, partial: 0, fail: 0, coveredCases: 0,
    },
    coverage: { outcomes: { percent: 0 } },
    nextFocus: { nextAction: '记录首批 outcome' },
  });
  assert.equal(dimension.status, 'unknown');
  assert.match(dimension.evidence, /0\/15/);
  assert.match(dimension.evidence, /4 个 component-boundary case 已排除/);
});

test('AI 治理 scorecard 在只有 stale history 时保持 unknown', () => {
  const dimension = behaviorDimension({
    ok: true,
    counts: {
      cases: 13,
      outcomes: 0,
      totalOutcomes: 1,
      activeLatestOutcomes: 0,
      staleOutcomes: 1,
      pass: 0,
      partial: 0,
      fail: 0,
      coveredCases: 0,
    },
    coverage: { outcomes: { percent: 0 } },
    nextFocus: { nextAction: '记录当前 caseVersion 的 outcome' },
  });
  assert.equal(dimension.status, 'unknown');
});

test('AI 治理 scorecard 将 current runner 通过但 evidence stale 标为 warn', () => {
  const dimension = behaviorDimension({
    ok: false, contractFailures: [], currentRunFailures: [],
    evidenceFreshness: { status: 'stale', staleCaseIds: ['mcp-readonly-shell-rejection'], failures: ['revision stale'] },
    counts: { cases: 18, behaviorCases: 18, outcomes: 0, coveredCases: 0,
      currentRunVerifiedOutcomes: 1, evidenceFreshnessFailures: 1 },
    coverage: { outcomes: { percent: 0 } },
    nextFocus: { nextAction: '冻结 source 后由维护者刷新 deterministic evidence' },
  });
  assert.equal(dimension.status, 'warn');
  assert.match(dimension.evidence, /1 个当前重放通过但待刷新/);
});

test('AI 治理 scorecard 只有在覆盖充分且无弱 outcome 时通过', () => {
  const passing = behaviorDimension({
    ok: true,
    counts: { cases: 13, outcomes: 8, pass: 8, partial: 0, fail: 0, coveredCases: 8 },
    coverage: { outcomes: { percent: 62 } },
    nextFocus: { nextAction: '保持真实 outcome 记录' },
  });
  const warning = behaviorDimension({
    ok: true,
    counts: { cases: 13, outcomes: 8, pass: 8, partial: 0, fail: 0, unverifiedFail: 1, coveredCases: 8 },
    coverage: { outcomes: { percent: 62 } },
    nextFocus: { nextAction: '复核非确定性 feedback' },
  });
  const unknownIntegrity = behaviorDimension({
    ok: true, counts: { cases: 13, outcomes: 8, pass: 8, partial: 0, fail: 0, coveredCases: 8 },
    coverage: { outcomes: { percent: 62 } }, ledgerIntegrity: { status: 'unknown' },
    nextFocus: { nextAction: '建立 Git 账本基线' },
  });
  const legacyChain = behaviorDimension({ ok: true, counts: { cases: 13, outcomes: 8, pass: 8, partial: 0, fail: 0, coveredCases: 8 },
    coverage: { outcomes: { percent: 62 } }, ledgerChain: { status: 'legacy' } });
  const openSignal = behaviorDimension({
    ok: true,
    counts: { cases: 13, outcomes: 8, pass: 8, partial: 0, fail: 0, openFeedbackSignals: 1, coveredCases: 8 },
    coverage: { outcomes: { percent: 62 } },
  });
  assert.equal(passing.status, 'pass');
  assert.equal(warning.status, 'warn');
  assert.equal(unknownIntegrity.status, 'warn');
  assert.equal(legacyChain.status, 'warn');
  assert.equal(openSignal.status, 'warn');
  assert.match(openSignal.evidence, /1 个 open signal/);
});

test('AI 治理 scorecard 将 trace-bound unverified pass 与无证据区分为 warn', () => {
  const dimension = behaviorDimension({
    ok: true,
    counts: {
      cases: 15, outcomes: 0, recordedActiveOutcomes: 1,
      traceBoundOutcomes: 1, traceVerifiedOutcomes: 0,
      unverifiedOutcomes: 1, unverifiedPass: 1, coveredCases: 0,
    },
    coverage: { outcomes: { percent: 0 } },
    nextFocus: { nextAction: '接入可信 host adapter' },
  });
  assert.equal(dimension.status, 'warn');
  assert.match(dimension.evidence, /1 个待验证/);
});
