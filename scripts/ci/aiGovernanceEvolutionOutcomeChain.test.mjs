import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildEvolutionOutcomeChainReport,
  hashEvolutionOutcomeLegacyPrefix,
  hashEvolutionOutcomeV3Line,
} from './aiGovernanceEvolutionOutcomeChain.mjs';

const compact = value => JSON.stringify(value);
const entriesFrom = lines => lines.map((line, index) => ({
  line,
  ordinal: index + 1,
  outcome: JSON.parse(line),
}));
const outcome = (id, overrides = {}) => ({
  schemaVersion: 2,
  id,
  caseId: 'chain-case',
  caseVersion: 1,
  subjectVersion: '1.0.0',
  verdict: 'pass',
  ...overrides,
});
const chained = ({ id, lines, verdict = 'pass', previousOutcomeId = null, disposition = 'none', ...overrides }) => ({
  ...outcome(id, { schemaVersion: 3, verdict }),
  chain: {
    sequence: lines.length + 1,
    previousHash: lines.some(line => JSON.parse(line).schemaVersion === 3)
      ? hashEvolutionOutcomeV3Line(lines.at(-1))
      : hashEvolutionOutcomeLegacyPrefix(lines),
  },
  supersession: {
    previousOutcomeId,
    feedbackDisposition: disposition,
    summary: '脱敏的 lineage 处置摘要',
  },
  ...overrides,
});

test('outcome v3 链锚定 legacy 前缀并显式排序同日尝试', () => {
  const legacyLine = compact(outcome('legacy-pass'));
  const first = chained({ id: 'chain-pass', lines: [legacyLine], previousOutcomeId: 'legacy-pass' });
  const firstLine = compact(first);
  const second = chained({
    id: 'chain-fail', lines: [legacyLine, firstLine], verdict: 'fail',
    previousOutcomeId: 'chain-pass', disposition: 'open',
  });
  const secondLine = compact(second);
  const report = buildEvolutionOutcomeChainReport(entriesFrom([legacyLine, firstLine, secondLine]));

  assert.deepEqual(report.failures, []);
  assert.deepEqual(report.summary, {
    status: 'pass',
    totalOutcomes: 3,
    legacyOutcomes: 1,
    chainedOutcomes: 2,
    headSequence: 3,
    headSha256: hashEvolutionOutcomeV3Line(secondLine),
    openFeedback: 1,
    resolvedFeedback: 0,
  });
});

test('outcome v3 链拒绝前缀篡改、跳号、错 hash、降级和非紧凑行', () => {
  const legacyLine = compact(outcome('legacy-pass'));
  const valid = chained({ id: 'chain-pass', lines: [legacyLine], previousOutcomeId: 'legacy-pass' });
  const validLine = compact(valid);
  const cases = [
    [compact(outcome('legacy-changed')), validLine],
    [legacyLine, compact({ ...valid, chain: { ...valid.chain, sequence: 3 } })],
    [legacyLine, compact({ ...valid, chain: { ...valid.chain, previousHash: 'a'.repeat(64) } })],
    [legacyLine, validLine, compact(outcome('legacy-after-v3'))],
    [legacyLine, validLine.replace('{"schemaVersion"', '{ "schemaVersion"')],
  ];

  for (const lines of cases) {
    const entries = lines.map((line, index) => {
      try { return { line, ordinal: index + 1, outcome: JSON.parse(line) }; }
      catch { return { line, ordinal: index + 1, outcome: null }; }
    });
    assert.equal(buildEvolutionOutcomeChainReport(entries).summary.status, 'fail');
  }
});

test('outcome v3 supersession 只允许直接前驱并要求弱结果显式 resolved', () => {
  const failureLine = compact(outcome('legacy-fail', { verdict: 'fail' }));
  const resolved = chained({
    id: 'fixed-pass', lines: [failureLine], previousOutcomeId: 'legacy-fail', disposition: 'resolved',
  });
  const resolvedReport = buildEvolutionOutcomeChainReport(entriesFrom([failureLine, compact(resolved)]));
  assert.deepEqual(resolvedReport.failures, []);
  assert.equal(resolvedReport.summary.openFeedback, 0);
  assert.equal(resolvedReport.summary.resolvedFeedback, 1);

  const missingResolution = { ...resolved, supersession: { ...resolved.supersession, feedbackDisposition: 'none' } };
  const wrongPredecessor = { ...resolved, supersession: { ...resolved.supersession, previousOutcomeId: 'other-case' } };
  for (const invalid of [missingResolution, wrongPredecessor]) {
    const report = buildEvolutionOutcomeChainReport(entriesFrom([failureLine, compact(invalid)]));
    assert.equal(report.summary.status, 'fail');
  }
});

test('outcome v3 sequence 必须是与物理位置一致的安全整数', () => {
  const first = chained({ id: 'first-pass', lines: [] });
  first.chain.sequence = Number.MAX_SAFE_INTEGER + 1;
  const report = buildEvolutionOutcomeChainReport(entriesFrom([compact(first)]));
  assert.match(report.failures.join('\n'), /sequence/);
});
