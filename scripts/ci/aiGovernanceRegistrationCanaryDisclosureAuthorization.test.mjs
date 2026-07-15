import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildRegistrationCanaryAuthorizationStatement,
  buildRegistrationCanaryDisclosureCommitment,
  collectRegistrationCanaryAuthorizationStatementFailures,
  collectRegistrationCanaryDisclosureCommitmentFailures,
  verifyRegistrationCanaryDisclosureAuthorization,
} from './aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs';
import {
  buildRegistrationCanaryConsumptionStatement,
  collectRegistrationCanaryConsumptionStatementFailures,
  verifyRegistrationCanaryDisclosureConsumption,
  verifyRegistrationCanaryDisclosureTranscript,
} from './aiGovernanceRegistrationCanaryDisclosureConsumption.mjs';
import { createRegistrationCanaryAnchorProtocolFixture } from './aiGovernanceRegistrationCanaryAnchorTestFixtures.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const verifiedInputs = fixture => ({
  checkpointRequestJson: fixture.checkpointRequestJson,
  anchorReceiptJson: fixture.anchorReceiptJson,
  authorizationReceiptJson: fixture.authorizationReceiptJson,
  packetBundles: fixture.packetBundles,
  blindGrades: fixture.blindGrades,
  hostRunRecordJsons: fixture.hostRunRecordJsons,
  anchorPublicKey: fixture.signers.anchor.publicKey,
  authorizationPublicKey: fixture.signers.authorization.publicKey,
  anchorExpectedBindings: fixture.anchorExpectedBindings,
});

test('disclosure commitment 只保留排序 alias 与 host digest，并绑定 checkpoint', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const commitment = buildRegistrationCanaryDisclosureCommitment(fixture);
  assert.deepEqual(collectRegistrationCanaryDisclosureCommitmentFailures(commitment), []);
  assert.equal(commitment.count, 6);
  assert.deepEqual(commitment.refs.map(ref => ref.blindTrialAlias), [...commitment.refs.map(ref => ref.blindTrialAlias)].sort());
  assert.match(commitment.commitmentSha256, /^[0-9a-f]{64}$/);
  assert.doesNotMatch(JSON.stringify(commitment), /"(?:arm|trial|pair|treatment|pluginStateObserved|leaseKeySha256)"\s*:/);
  assert.equal(commitment.privacy.hostBodyStored, false);
  const changedRecords = [...fixture.hostRunRecordJsons];
  const changed = JSON.parse(changedRecords[0]);
  changed.taskInstanceSha256 = 'f'.repeat(64);
  changedRecords[0] = JSON.stringify(changed);
  assert.notEqual(
    buildRegistrationCanaryDisclosureCommitment({ ...fixture, hostRunRecordJsons: changedRecords }).commitmentSha256,
    commitment.commitmentSha256,
  );
});

test('authorization 精确绑定 anchor、host commitment、audience/action 与角色 key', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  assert.deepEqual(collectRegistrationCanaryAuthorizationStatementFailures(fixture.authorizationStatement), []);
  const report = verifyRegistrationCanaryDisclosureAuthorization(verifiedInputs(fixture));
  assert.equal(report.verificationStatus, 'signature-verified-unwitnessed');
  assert.equal(report.stateStatus, 'authorized-signature-bound-not-consumed');
  assert.equal(report.evidenceScope, 'component-only');
  assert.equal(report.anchorBindingStatus, 'matched-caller-expected');
  assert.equal(report.trust.atMostOnceVerified, false);
  assert.equal(report.trust.hostCommitmentPreexistingVerified, false);
  assert.equal(report.writebackCandidate.status, 'blocked');
  assert.notEqual(report.signatures.anchor.keyid, report.signatures.authorization.keyid);
  assert.throws(() => verifyRegistrationCanaryDisclosureAuthorization({
    ...verifiedInputs(fixture),
    anchorExpectedBindings: {
      ...fixture.anchorExpectedBindings,
      batchId: `batch-${'f'.repeat(32)}`,
    },
  }), /expectedBindings/);
});

test('consumption 链固定 authorized→consumed，但无外部 witness 时不声称单次可信', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  assert.deepEqual(collectRegistrationCanaryConsumptionStatementFailures(fixture.consumptionStatement), []);
  const report = verifyRegistrationCanaryDisclosureConsumption({
    ...verifiedInputs(fixture),
    consumptionReceiptJson: fixture.consumptionReceiptJson,
    redemptionRequestJson: fixture.redemptionRequestJson,
    consumerPublicKey: fixture.signers.consumer.publicKey,
  });
  assert.equal(report.verificationStatus, 'signature-verified-unwitnessed');
  assert.equal(report.stateStatus, 'consumed-signature-bound-unwitnessed');
  assert.equal(report.anchorBindingStatus, 'matched-caller-expected');
  assert.equal(report.trust.externalStateVerified, false);
  assert.equal(report.trust.nonEquivocationVerified, false);
  assert.equal(report.trust.atMostOnceVerified, false);
  assert.equal(report.writebackCandidate.reasonCode, 'external-state-and-witness-required');
  assert.equal(new Set(Object.values(report.signatures).map(item => item.keyid)).size, 3);
});

test('transcript 对同一 proof 的 anchor transport 变体按 host expected key 确定性选择', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const renamedEnvelope = JSON.parse(fixture.anchorReceiptJson);
  renamedEnvelope.signatures[0].keyid = 'renamed-transport-hint';
  const input = {
    ...verifiedInputs(fixture),
    redemptionRequestJson: fixture.redemptionRequestJson,
    anchorReceiptJsons: [fixture.anchorReceiptJson, JSON.stringify(renamedEnvelope)],
    authorizationReceiptJsons: [fixture.authorizationReceiptJson],
    consumptionReceiptJsons: [fixture.consumptionReceiptJson],
    consumerPublicKey: fixture.signers.consumer.publicKey,
  };
  const forward = verifyRegistrationCanaryDisclosureTranscript(input);
  const reversed = verifyRegistrationCanaryDisclosureTranscript({
    ...input,
    anchorReceiptJsons: [...input.anchorReceiptJsons].reverse(),
  });
  assert.deepEqual(reversed, forward);
  assert.equal(forward.anchorBindingStatus, 'matched-caller-expected');
});

test('authorization/consumption 拒绝跨批 host 嫁接、redemption 漂移和角色 key 复用', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const changedRecords = [...fixture.hostRunRecordJsons];
  const changedRecord = JSON.parse(changedRecords[0]);
  changedRecord.taskInstanceSha256 = 'f'.repeat(64);
  changedRecords[0] = JSON.stringify(changedRecord);
  assert.throws(() => verifyRegistrationCanaryDisclosureAuthorization({
    ...verifiedInputs(fixture),
    hostRunRecordJsons: changedRecords,
  }), /跨批|绑定不匹配/);
  const changedRedemption = structuredClone(fixture.redemptionRequest);
  changedRedemption.nonceSha256 = 'e'.repeat(64);
  assert.throws(() => verifyRegistrationCanaryDisclosureConsumption({
    ...verifiedInputs(fixture),
    consumptionReceiptJson: fixture.consumptionReceiptJson,
    redemptionRequestJson: JSON.stringify(changedRedemption),
    consumerPublicKey: fixture.signers.consumer.publicKey,
  }), /跨批|绑定不匹配/);
  const reusedKeyReceipt = fixture.signStatement(fixture.authorizationStatement, fixture.signers.anchor);
  assert.throws(() => verifyRegistrationCanaryDisclosureAuthorization({
    ...verifiedInputs(fixture),
    authorizationReceiptJson: reusedKeyReceipt,
  }), /不同角色 keyid/);
});

test('状态跳转、错误 predicate、双授权和双消费 fail closed', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  for (const mutate of [
    changed => { changed.predicate.state.expectedVersion = 0; },
    changed => { changed.predicate.maxUses = 2; },
    changed => { changed.predicate.audience = 'wildcard'; },
    changed => { changed.predicate.verified = true; },
  ]) {
    const changed = structuredClone(fixture.authorizationStatement);
    mutate(changed);
    assert.notDeepEqual(collectRegistrationCanaryAuthorizationStatementFailures(changed), []);
  }
  const secondAuthorizationStatement = buildRegistrationCanaryAuthorizationStatement({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    packetBundles: fixture.packetBundles,
    blindGrades: fixture.blindGrades,
    hostRunRecordJsons: fixture.hostRunRecordJsons,
    grantId: `grant-${'b'.repeat(32)}`,
    senderConstraint: structuredClone(fixture.authorizationStatement.predicate.senderConstraint),
    policy: { id: 'external-disclosure-policy', version: '1.0.0', sha256: '9'.repeat(64) },
  });
  const secondAuthorizationReceipt = fixture.signStatement(secondAuthorizationStatement, fixture.signers.authorization);
  const transcriptInput = {
    checkpointRequestJson: fixture.checkpointRequestJson,
    packetBundles: fixture.packetBundles,
    blindGrades: fixture.blindGrades,
    hostRunRecordJsons: fixture.hostRunRecordJsons,
    redemptionRequestJson: fixture.redemptionRequestJson,
    anchorReceiptJsons: [fixture.anchorReceiptJson],
    authorizationReceiptJsons: [fixture.authorizationReceiptJson, secondAuthorizationReceipt],
    consumptionReceiptJsons: [fixture.consumptionReceiptJson],
  };
  assert.throws(() => verifyRegistrationCanaryDisclosureTranscript(transcriptInput), /双授权|分叉/);
  const secondConsumptionStatement = buildRegistrationCanaryConsumptionStatement({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    authorizationReceiptJson: fixture.authorizationReceiptJson,
    packetBundles: fixture.packetBundles,
    blindGrades: fixture.blindGrades,
    hostRunRecordJsons: fixture.hostRunRecordJsons,
    redemptionRequestJson: fixture.redemptionRequestJson,
    policy: { id: 'external-consumption-policy-v2', version: '1.0.0', sha256: 'c'.repeat(64) },
  });
  const secondConsumptionReceipt = fixture.signStatement(secondConsumptionStatement, fixture.signers.consumer);
  assert.throws(() => verifyRegistrationCanaryDisclosureTranscript({
    ...transcriptInput,
    authorizationReceiptJsons: [fixture.authorizationReceiptJson],
    consumptionReceiptJsons: [fixture.consumptionReceiptJson, secondConsumptionReceipt],
  }), /双消费|分叉/);
});

test('authorization 生产模块不生成密钥、不持久化状态且不写治理资产', () => {
  const files = [
    'scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs',
    'scripts/ci/aiGovernanceRegistrationCanaryDisclosureConsumption.mjs',
  ];
  const source = files.map(file => fs.readFileSync(path.join(rootDir, file), 'utf8')).join('\n');
  assert.doesNotMatch(source, /generateKey|privateKey|createPrivateKey|readFile|writeFile|appendFile|fetch\(|Date\.now|new Date/);
  assert.doesNotMatch(source, /atMostOnceVerified\s*:\s*true|externalStateVerified\s*:\s*true|nonEquivocationVerified\s*:\s*true|trustedSigners\s*:\s*[1-9]/);
});
