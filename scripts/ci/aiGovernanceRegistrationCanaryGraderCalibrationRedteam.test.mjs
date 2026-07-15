import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildRegistrationCanaryGraderCalibrationReport,
  readRegistrationCanaryGraderCalibration,
} from './aiGovernanceRegistrationCanaryGraderCalibration.mjs';
import { registrationCanaryCalibrationOperationId } from './aiGovernanceRegistrationCanaryCalibrationFixtures.mjs';
import {
  gradeRegistrationCanaryResultBlind,
  registrationCanaryBlindOperationId,
} from './aiGovernanceRegistrationCanaryResult.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const calibrationPath = path.join(rootDir, 'evals/ai-governance/grader-calibration.json');
const sha256 = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const withCalibration = (mutate, callback) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-grader-redteam-'));
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

const assertRejectedBeforeGrade = (mutate, pattern) => withCalibration(mutate, (target) => {
  let calls = 0;
  const report = buildRegistrationCanaryGraderCalibrationReport({
    rootDir,
    calibrationPath: target,
    gradeResult: (input) => {
      calls += 1;
      return gradeRegistrationCanaryResultBlind(input);
    },
  });
  assert.equal(report.ok, false);
  assert.equal(calls, 0);
  assert.equal(report.counts.graderInvocations, 0);
  assert.match(report.failures.join('\n'), pattern);
});

test('registration grader calibration 拒绝用任意安全文件冒充实际 import', () => {
  assertRejectedBeforeGrade((value) => {
    value.grader.implementationPath = 'AGENTS.md';
    value.grader.implementationSha256 = sha256(path.join(rootDir, 'AGENTS.md'));
    value.fixture.factoryPath = 'rules/code-style.md';
    value.fixture.factorySha256 = sha256(path.join(rootDir, 'rules/code-style.md'));
  }, /implementationPath|factoryPath/);
});

test('registration grader calibration 拒绝 target case ID 漂移', () => {
  assertRejectedBeforeGrade((value) => {
    value.target.caseRef.id = 'rule-read-before-write';
  }, /target case/);
});

test('registration grader calibration 拒绝删减未命中样本的 failure taxonomy', () => {
  assertRejectedBeforeGrade((value) => {
    value.rubric.failureTaxonomy['infrastructure-invalid'] = value.rubric.failureTaxonomy['infrastructure-invalid']
      .filter(code => code !== 'stdout-not-drained');
  }, /taxonomy|reason/);
});

test('registration grader calibration 拒绝路径祖先 symlink', {
  skip: process.platform === 'win32',
}, () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-grader-symlink-'));
  try {
    const fixtureRoot = path.join(tempDir, 'root');
    const linkedScripts = path.join(tempDir, 'linked-scripts');
    fs.mkdirSync(path.join(fixtureRoot, 'evals/ai-governance'), { recursive: true });
    fs.mkdirSync(path.join(linkedScripts, 'ci'), { recursive: true });
    fs.copyFileSync(calibrationPath, path.join(fixtureRoot, 'evals/ai-governance/grader-calibration.json'));
    for (const file of [
      'aiGovernanceRegistrationCanaryResult.mjs',
      'aiGovernanceRegistrationCanaryCalibrationFixtures.mjs',
    ]) fs.copyFileSync(path.join(rootDir, 'scripts/ci', file), path.join(linkedScripts, 'ci', file));
    fs.symlinkSync(linkedScripts, path.join(fixtureRoot, 'scripts'), 'dir');
    const result = readRegistrationCanaryGraderCalibration({ rootDir: fixtureRoot });
    assert.match(result.failures.join('\n'), /symlink|realpath/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('registration calibration fixture 不共享生产 result operation ID 实现', () => {
  const source = fs.readFileSync(
    path.join(rootDir, 'scripts/ci/aiGovernanceRegistrationCanaryCalibrationFixtures.mjs'),
    'utf8',
  );
  assert.doesNotMatch(source, /aiGovernanceRegistrationCanaryResult|registrationCanaryBlindOperationId/);
});

test('registration calibration 与生产 operation ID 分别命中固定参考向量', () => {
  const alias = 'canary-0123456789abcdef0123456789abcdef';
  const expected = 'op-89653dd1a413340a69344697';
  assert.equal(registrationCanaryCalibrationOperationId(alias), expected);
  assert.equal(registrationCanaryBlindOperationId(alias), expected);
});
