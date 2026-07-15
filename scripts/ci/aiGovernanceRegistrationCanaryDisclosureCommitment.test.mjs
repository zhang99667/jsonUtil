import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildRegistrationCanaryDisclosureCommitment,
  collectRegistrationCanaryDisclosureCommitmentFailures,
} from './aiGovernanceRegistrationCanaryDisclosureCommitment.mjs';
import {
  buildRegistrationCanaryDisclosureCommitment as buildLegacyDisclosureCommitment,
  collectRegistrationCanaryDisclosureCommitmentFailures as collectLegacyDisclosureCommitmentFailures,
} from './aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs';
import { createRegistrationCanaryAnchorProtocolFixture } from './aiGovernanceRegistrationCanaryAnchorTestFixtures.mjs';

test('disclosure commitment 只保留排序 alias 与 host digest，并绑定 checkpoint', () => {
  assert.strictEqual(buildLegacyDisclosureCommitment, buildRegistrationCanaryDisclosureCommitment);
  assert.strictEqual(
    collectLegacyDisclosureCommitmentFailures,
    collectRegistrationCanaryDisclosureCommitmentFailures,
  );

  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const commitment = buildRegistrationCanaryDisclosureCommitment(fixture);
  assert.deepEqual(collectRegistrationCanaryDisclosureCommitmentFailures(commitment), []);
  assert.equal(commitment.count, 6);
  const aliases = commitment.refs.map(ref => ref.blindTrialAlias);
  assert.deepEqual(aliases, [...aliases].sort());
  assert.match(commitment.commitmentSha256, /^[0-9a-f]{64}$/);
  assert.doesNotMatch(
    JSON.stringify(commitment),
    /"(?:arm|trial|pair|treatment|pluginStateObserved|leaseKeySha256)"\s*:/,
  );
  assert.equal(commitment.privacy.hostBodyStored, false);

  const changedRecords = [...fixture.hostRunRecordJsons];
  const changed = JSON.parse(changedRecords[0]);
  changed.taskInstanceSha256 = 'f'.repeat(64);
  changedRecords[0] = JSON.stringify(changed);
  assert.notEqual(
    buildRegistrationCanaryDisclosureCommitment({
      ...fixture,
      hostRunRecordJsons: changedRecords,
    }).commitmentSha256,
    commitment.commitmentSha256,
  );
});
