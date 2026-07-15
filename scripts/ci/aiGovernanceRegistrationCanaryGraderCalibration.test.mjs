import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildRegistrationCanaryGraderCalibrationReport,
} from './aiGovernanceRegistrationCanaryGraderCalibration.mjs';
import { buildAiGovernanceEvolutionSuiteReport } from './aiGovernanceEvolutionSuiteReport.mjs';
import { gradeRegistrationCanaryResultBlind } from './aiGovernanceRegistrationCanaryResult.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const calibrationPath = path.join(rootDir, 'evals/ai-governance/grader-calibration.json');
const ledgerPaths = [
  'evals/ai-governance/feedback-inbox.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
  'evals/ai-governance/outcomes.jsonl',
].map(file => path.join(rootDir, file));
const hashFile = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const snapshotLedgers = () => ledgerPaths.map(file => ({ file, sha256: hashFile(file), stat: fs.statSync(file) }));
const assertLedgersUnchanged = (before) => before.forEach((entry) => {
  const after = fs.statSync(entry.file);
  assert.equal(hashFile(entry.file), entry.sha256);
  assert.equal(after.size, entry.stat.size);
  assert.equal(after.mtimeMs, entry.stat.mtimeMs);
});

const withCalibration = (mutate, callback) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-grader-calibration-'));
  try {
    const target = path.join(tempDir, 'grader-calibration.json');
    const value = JSON.parse(fs.readFileSync(calibrationPath, 'utf8'));
    mutate(value);
    fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
    callback(target);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

test('registration grader calibration 真实调用生产 grader 并保持 component-only 零写账', () => {
  const before = snapshotLedgers();
  const report = buildRegistrationCanaryGraderCalibrationReport({ rootDir });
  assert.equal(report.ok, true);
  assert.equal(report.evidenceScope, 'component-only');
  assert.deepEqual(report.counts, { samples: 17, graderInvocations: 51, exactMatches: 17, failures: 0 });
  assert.equal(report.metrics.exactAgreement, 1);
  assert.equal(report.metrics.labelAccuracy, 1);
  assert.equal(report.metrics.macroF1, 1);
  assert.deepEqual(report.metrics.classRecall, {
    pass: 1, 'behavior-fail': 1, 'infrastructure-invalid': 1, 'input-rejected': 1,
  });
  assert.equal(report.metrics.reasonCodeAgreement, 1);
  assert.equal(report.metrics.determinism, 1);
  assert.equal(report.metrics.mutationSensitivity, 1);
  assert.equal(report.claims.graderInvoked, true);
  assert.equal(report.claims.behaviorCoverageDelta, 0);
  assert.equal(report.claims.automaticLedgerWrites, false);
  assert.equal(report.claims.outcomeEligible, false);
  assert.equal(report.claims.trusted, false);
  assert.deepEqual(new Set(report.samples.map(item => item.actualLabel)), new Set([
    'pass', 'behavior-fail', 'infrastructure-invalid', 'input-rejected',
  ]));
  assert.doesNotMatch(JSON.stringify(report), /resultJson|agentPacket|graderPacket|responseBody|traceBody/);
  assertLedgersUnchanged(before);
});

test('registration grader calibration 拒绝实现摘要漂移且不调用 grader', () => {
  withCalibration((value) => { value.grader.implementationSha256 = '0'.repeat(64); }, (target) => {
    let calls = 0;
    const report = buildRegistrationCanaryGraderCalibrationReport({
      rootDir,
      calibrationPath: target,
      gradeResult: (input) => { calls += 1; return gradeRegistrationCanaryResultBlind(input); },
    });
    assert.equal(report.ok, false);
    assert.equal(calls, 0);
    assert.equal(report.counts.graderInvocations, 0);
    assert.match(report.failures.join('\n'), /implementationSha256/);
  });
});

test('registration grader calibration 用独立 oracle 捕获错误分类与 reason 漂移', () => {
  const report = buildRegistrationCanaryGraderCalibrationReport({
    rootDir,
    gradeResult: (input) => {
      const grade = gradeRegistrationCanaryResultBlind(input);
      if (grade.grade.status === 'ungradable') {
        return {
          ...grade,
          grade: { status: 'graded', verdict: 'fail', score: 0 },
          reasonCodes: ['trace-policy-not-satisfied'],
        };
      }
      return grade;
    },
  });
  assert.equal(report.ok, false);
  assert.ok(report.metrics.macroF1 < 1);
  assert.ok(report.metrics.reasonCodeAgreement < 1);
  assert.ok(report.metrics.classRecall['infrastructure-invalid'] < 1);
  assert.match(report.failures.join('\n'), /macroF1|reasonCodeAgreement|recall infrastructure-invalid/);
});

test('registration grader calibration 三次重放捕获非确定性 grader', () => {
  let calls = 0;
  const report = buildRegistrationCanaryGraderCalibrationReport({
    rootDir,
    gradeResult: (input) => {
      calls += 1;
      const grade = gradeRegistrationCanaryResultBlind(input);
      if (calls === 3) return {
        ...grade,
        grade: { status: 'graded', verdict: 'fail', score: 0 },
        reasonCodes: ['trace-policy-not-satisfied'],
      };
      return grade;
    },
  });
  assert.equal(report.ok, false);
  assert.ok(report.metrics.determinism < 1);
  assert.match(report.failures.join('\n'), /determinism|gold-registration-discovered/);
});

test('registration grader calibration 失败进入 suite contractFailures 与独立 nextFocus', () => {
  withCalibration((value) => { value.fixture.factorySha256 = '0'.repeat(64); }, (target) => {
    const report = buildAiGovernanceEvolutionSuiteReport({ rootDir, graderCalibrationPath: target });
    assert.equal(report.ok, false);
    assert.equal(report.graderHealth.ok, false);
    assert.equal(report.nextFocus.id, 'fix-grader-calibration');
    assert.deepEqual(report.nextFocus.caseIds, ['mcp-registration-canary-result-ingestion-boundary']);
    assert.match(report.contractFailures.join('\n'), /grader calibration: grader fixture\.factorySha256/);
    assert.equal(report.counts.graderCalibrationSamples, 0);
    assert.ok(report.counts.graderCalibrationFailures > 0);
    assert.equal(report.coverage.outcomes.totalCases, 18);
  });
});
