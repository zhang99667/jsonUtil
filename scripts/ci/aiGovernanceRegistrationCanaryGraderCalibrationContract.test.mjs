import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readRegistrationCanaryGraderCalibration as readFromEntry } from './aiGovernanceRegistrationCanaryGraderCalibration.mjs';
import { readRegistrationCanaryGraderCalibration as readFromContract } from './aiGovernanceRegistrationCanaryGraderCalibrationContract.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const calibrationPath = path.join(rootDir, 'evals/ai-governance/grader-calibration.json');

const withCalibration = (mutate, callback) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-grader-contract-'));
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

test('registration grader calibration contract 独立读取当前绑定并保留原入口同引用导出', () => {
  assert.strictEqual(readFromEntry, readFromContract);
  const result = readFromContract({ rootDir });
  assert.deepEqual(result.failures, []);
  assert.match(result.calibrationSha256, /^[0-9a-f]{64}$/);
});

test('registration grader calibration contract 对非法 JSON 返回固定零摘要失败', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-grader-contract-'));
  try {
    const calibrationPath = path.join(tempDir, 'grader-calibration.json');
    fs.writeFileSync(calibrationPath, '{');
    const result = readFromContract({ rootDir, calibrationPath });
    assert.equal(result.calibration, null);
    assert.equal(result.calibrationSha256, null);
    assert.deepEqual(result.failures, ['grader-calibration.json 必须是可读取的合法 JSON']);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('registration grader calibration 的 oracle 与 fixture 不被生产 grader 反向导入', () => {
  const productionSource = fs.readFileSync(path.join(rootDir, 'scripts/ci/aiGovernanceRegistrationCanaryResult.mjs'), 'utf8');
  const fixtureSource = fs.readFileSync(path.join(rootDir, 'scripts/ci/aiGovernanceRegistrationCanaryCalibrationFixtures.mjs'), 'utf8');
  assert.doesNotMatch(productionSource, /grader-calibration|GraderCalibration|CalibrationFixtures/);
  assert.doesNotMatch(fixtureSource, /gradeRegistrationCanaryResultBlind/);
});

test('registration grader calibration contract 拒绝弱化阈值、重复 mutation 与缺失类别', () => {
  withCalibration((value) => {
    value.thresholds.macroF1 = 0.9;
    value.samples[1].mutation = value.samples[0].mutation;
    value.samples = value.samples.filter(item => item.oracle.label !== 'input-rejected');
  }, (target) => {
    const result = readFromContract({ rootDir, calibrationPath: target });
    assert.match(result.failures.join('\n'), /threshold macroF1 必须为 1/);
    assert.match(result.failures.join('\n'), /mutation 非法或重复/);
    assert.match(result.failures.join('\n'), /覆盖四种 grader label|至少需要 8/);
  });
});
