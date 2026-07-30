import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildRegistrationCanaryCalibrationFixtureContext,
  buildRegistrationCanaryCalibrationInput as buildFromFacade,
  REGISTRATION_CANARY_CALIBRATION_MUTATIONS as mutationsFromFacade,
} from './aiGovernanceRegistrationCanaryCalibrationFixtures.mjs';
import {
  buildRegistrationCanaryCalibrationInput,
  REGISTRATION_CANARY_CALIBRATION_MUTATIONS,
} from './aiGovernanceRegistrationCanaryCalibrationMutations.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const context = buildRegistrationCanaryCalibrationFixtureContext({ rootDir });

test('registration calibration fixture façade 保持 mutation 导出同引用', () => {
  assert.equal(buildFromFacade, buildRegistrationCanaryCalibrationInput);
  assert.equal(mutationsFromFacade, REGISTRATION_CANARY_CALIBRATION_MUTATIONS);
  assert.equal(Object.isFrozen(REGISTRATION_CANARY_CALIBRATION_MUTATIONS), true);
});

test('registration calibration mutation 叶子独立构造 control 与缺失发现输入', () => {
  const control = buildRegistrationCanaryCalibrationInput(context, 'control-pass');
  const missing = buildRegistrationCanaryCalibrationInput(context, 'behavior-missing-discovery');

  assert.equal(JSON.parse(control.resultJson).observation.serverDiscovery, 'discovered');
  assert.equal(JSON.parse(missing.resultJson).observation.serverDiscovery, 'missing');
  assert.equal(
    JSON.parse(missing.resultJson).trace.events.some(event => event.type === 'mcp.call'),
    false,
  );
});

test('registration calibration mutation 叶子保留 digest 对抗与未知类型拒绝', () => {
  const adversarial = buildRegistrationCanaryCalibrationInput(
    context,
    'adversarial-observation-digest',
  );
  const result = JSON.parse(adversarial.resultJson);

  assert.equal(result.observation.serverDiscovery, 'missing');
  assert.notEqual(
    result.bindings.observationSha256,
    context.packetHash('jsonutils.registration-canary.observation/v1', result.observation),
  );
  assert.throws(
    () => buildRegistrationCanaryCalibrationInput(context, 'unknown-mutation'),
    /未知 registration grader calibration mutation/,
  );
});
