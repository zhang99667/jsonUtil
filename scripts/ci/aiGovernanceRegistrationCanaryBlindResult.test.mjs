import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { buildRegistrationCanaryCalibrationFixtureContext } from './aiGovernanceRegistrationCanaryCalibrationFixtures.mjs';
import {
  collectRegistrationCanaryBlindResultFailures,
  parseRegistrationCanaryBlindResult,
} from './aiGovernanceRegistrationCanaryBlindResult.mjs';
import {
  collectRegistrationCanaryBlindResultFailures as collectFromFacade,
  parseRegistrationCanaryBlindResult as parseFromFacade,
} from './aiGovernanceRegistrationCanaryResult.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const {
  packetBundles,
  buildResult,
  refreshResultDigests,
} = buildRegistrationCanaryCalibrationFixtureContext({ rootDir });
const passingResult = buildResult(packetBundles[0]);

test('registration canary blind result 契约可直接摄取合法结果', () => {
  assert.deepEqual(
    parseRegistrationCanaryBlindResult(JSON.stringify(passingResult)),
    passingResult,
  );
  assert.deepEqual(collectRegistrationCanaryBlindResultFailures(passingResult), []);
});

test('registration canary result façade 保持 blind result 导出同引用', () => {
  assert.equal(collectFromFacade, collectRegistrationCanaryBlindResultFailures);
  assert.equal(parseFromFacade, parseRegistrationCanaryBlindResult);
});

test('registration canary blind result 契约拒绝侧信道与 digest 漂移', () => {
  const sideChannel = structuredClone(passingResult);
  sideChannel.trace.events
    .filter(event => event.operationId)
    .forEach((event) => { event.operationId = 'candidate'; });
  refreshResultDigests(sideChannel);
  assert.match(
    collectRegistrationCanaryBlindResultFailures(sideChannel).join('\n'),
    /侧信道/,
  );

  const digestDrift = structuredClone(passingResult);
  digestDrift.observation.serverDiscovery = 'missing';
  assert.throws(
    () => parseRegistrationCanaryBlindResult(JSON.stringify(digestDrift)),
    /observation digest 漂移/,
  );
});
