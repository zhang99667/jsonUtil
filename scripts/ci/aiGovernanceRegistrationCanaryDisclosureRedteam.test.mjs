import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildRegistrationCanaryAuthorizationStatement,
  buildRegistrationCanaryDisclosureCommitment,
  collectRegistrationCanaryAuthorizationStatementFailures,
} from './aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs';
import {
  buildRegistrationCanaryConsumptionStatement,
  collectRegistrationCanaryConsumptionStatementFailures,
  verifyRegistrationCanaryDisclosureConsumption,
} from './aiGovernanceRegistrationCanaryDisclosureConsumption.mjs';
import { parseRegistrationCanaryDsseEnvelope } from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import { hashRegistrationCanaryPacketValue } from './aiGovernanceRegistrationCanaryPacket.mjs';
import { createRegistrationCanaryAnchorProtocolFixture } from './aiGovernanceRegistrationCanaryAnchorTestFixtures.mjs';

const verifiedInputs = fixture => ({
  checkpointRequestJson: fixture.checkpointRequestJson,
  anchorReceiptJson: fixture.anchorReceiptJson,
  authorizationReceiptJson: fixture.authorizationReceiptJson,
  packetBundles: fixture.packetBundles,
  blindGrades: fixture.blindGrades,
  hostRunRecordJsons: fixture.hostRunRecordJsons,
  redemptionRequestJson: fixture.redemptionRequestJson,
  anchorPublicKey: fixture.signers.anchor.publicKey,
  authorizationPublicKey: fixture.signers.authorization.publicKey,
  anchorExpectedBindings: fixture.anchorExpectedBindings,
});

test('角色隔离比较 Ed25519 公钥指纹而不是可改名 keyid', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const sameKeyAuthorization = fixture.signStatement(fixture.authorizationStatement, {
    keyid: 'different-label-same-anchor-key',
    privateKey: fixture.signers.anchor.privateKey,
  });
  assert.throws(() => verifyRegistrationCanaryDisclosureConsumption({
    ...verifiedInputs(fixture),
    authorizationReceiptJson: sameKeyAuthorization,
    authorizationPublicKey: fixture.signers.anchor.publicKey,
    consumptionReceiptJson: fixture.consumptionReceiptJson,
    consumerPublicKey: fixture.signers.consumer.publicKey,
  }), /不同 Ed25519 公钥/);
});

test('consumer 签名公钥必须匹配 grant 的 Ed25519 SPKI sender constraint', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const other = createRegistrationCanaryAnchorProtocolFixture();
  const mismatchedConsumerReceipt = fixture.signStatement(fixture.consumptionStatement, other.signers.consumer);
  assert.throws(() => verifyRegistrationCanaryDisclosureConsumption({
    ...verifiedInputs(fixture),
    consumptionReceiptJson: mismatchedConsumerReceipt,
    consumerPublicKey: other.signers.consumer.publicKey,
  }), /sender constraint/);
});

test('host commitment 拒绝一致重签的 fixture/environment/hostBindings 跨批漂移', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const packetBundles = structuredClone(fixture.packetBundles);
  const hostRunRecordJsons = [...fixture.hostRunRecordJsons];
  const bundle = packetBundles[0];
  const changedEnvironment = 'f'.repeat(64);
  bundle.agent.bindings.environmentSha256 = changedEnvironment;
  bundle.host.bindings.environmentSha256 = changedEnvironment;
  bundle.host.projectionDigests.agentSha256 = hashRegistrationCanaryPacketValue(
    'jsonutils.registration-canary.agent-packet/v1', bundle.agent,
  );
  const record = JSON.parse(hostRunRecordJsons[0]);
  record.hostPacketSha256 = hashRegistrationCanaryPacketValue('jsonutils.registration-canary.host-packet/v1', bundle.host);
  record.hostBindingsSha256 = hashRegistrationCanaryPacketValue('jsonutils.registration-canary.host-bindings/v1', bundle.host.bindings);
  hostRunRecordJsons[0] = JSON.stringify(record);
  assert.throws(() => buildRegistrationCanaryDisclosureCommitment({
    checkpointRequestJson: fixture.checkpointRequestJson,
    packetBundles,
    blindGrades: fixture.blindGrades,
    hostRunRecordJsons,
  }), /checkpoint fixture\/environment\/experiment|host bindings 必须一致/);
});

test('host commitment 拒绝六条 packet 一致重签后嫁接另一组 Agent 投影', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const packetBundles = structuredClone(fixture.packetBundles);
  const hostRunRecordJsons = [...fixture.hostRunRecordJsons];
  packetBundles.forEach((bundle, index) => {
    bundle.agent.input.request = `projection-graft-${index}`;
    bundle.host.projectionDigests.agentSha256 = hashRegistrationCanaryPacketValue(
      'jsonutils.registration-canary.agent-packet/v1', bundle.agent,
    );
    const record = JSON.parse(hostRunRecordJsons[index]);
    record.hostPacketSha256 = hashRegistrationCanaryPacketValue(
      'jsonutils.registration-canary.host-packet/v1', bundle.host,
    );
    hostRunRecordJsons[index] = JSON.stringify(record);
  });
  assert.throws(() => buildRegistrationCanaryAuthorizationStatement({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    packetBundles,
    blindGrades: fixture.blindGrades,
    hostRunRecordJsons,
    grantId: `grant-${'b'.repeat(32)}`,
    senderConstraint: fixture.authorizationStatement.predicate.senderConstraint,
    policy: fixture.authorizationStatement.predicate.policy,
  }), /blind grade .*Agent\/grader 投影/);
});

test('grantId 与 redemption nonce 只改变 binding，不改变稳定 CAS state key', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const secondAuthorization = buildRegistrationCanaryAuthorizationStatement({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    packetBundles: fixture.packetBundles,
    blindGrades: fixture.blindGrades,
    hostRunRecordJsons: fixture.hostRunRecordJsons,
    grantId: `grant-${'b'.repeat(32)}`,
    senderConstraint: fixture.authorizationStatement.predicate.senderConstraint,
    policy: fixture.authorizationStatement.predicate.policy,
  });
  assert.equal(
    secondAuthorization.predicate.authorizationStateKeySha256,
    fixture.authorizationStatement.predicate.authorizationStateKeySha256,
  );
  assert.notEqual(
    secondAuthorization.predicate.authorizationBindingSha256,
    fixture.authorizationStatement.predicate.authorizationBindingSha256,
  );
  const changedRedemption = { ...fixture.redemptionRequest, nonceSha256: 'e'.repeat(64) };
  const secondConsumption = buildRegistrationCanaryConsumptionStatement({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    authorizationReceiptJson: fixture.authorizationReceiptJson,
    packetBundles: fixture.packetBundles,
    blindGrades: fixture.blindGrades,
    hostRunRecordJsons: fixture.hostRunRecordJsons,
    redemptionRequestJson: JSON.stringify(changedRedemption),
    policy: fixture.consumptionStatement.predicate.policy,
  });
  assert.equal(
    secondConsumption.predicate.consumptionStateKeySha256,
    fixture.consumptionStatement.predicate.consumptionStateKeySha256,
  );
  assert.notEqual(
    secondConsumption.predicate.consumptionBindingSha256,
    fixture.consumptionStatement.predicate.consumptionBindingSha256,
  );
});

test('policy/authority 疑似凭据值与未验签 consumed 声明被降级', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const credential = structuredClone(fixture.authorizationStatement);
  credential.predicate.policy.id = 'token:sk-abcdefghijkl';
  assert.match(collectRegistrationCanaryAuthorizationStatementFailures(credential).join('\n'), /疑似凭据值/);
  const envelope = JSON.parse(fixture.consumptionReceiptJson);
  envelope.signatures[0].sig = Buffer.alloc(64).toString('base64');
  const unchecked = verifyRegistrationCanaryDisclosureConsumption({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    authorizationReceiptJson: fixture.authorizationReceiptJson,
    consumptionReceiptJson: JSON.stringify(envelope),
    packetBundles: fixture.packetBundles,
    blindGrades: fixture.blindGrades,
    hostRunRecordJsons: fixture.hostRunRecordJsons,
    redemptionRequestJson: fixture.redemptionRequestJson,
  });
  assert.equal(unchecked.verificationStatus, 'valid-untrusted');
  assert.equal(unchecked.stateStatus, 'claimed-consumed-signature-unchecked');
});

test('receipt 链身份排除未签 keyid，只把 envelope hash 当 transport digest', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const renamed = JSON.parse(fixture.anchorReceiptJson);
  renamed.signatures[0].keyid = 'renamed-transport-hint';
  const original = parseRegistrationCanaryDsseEnvelope(fixture.anchorReceiptJson, 'anchor receipt');
  const changed = parseRegistrationCanaryDsseEnvelope(JSON.stringify(renamed), 'anchor receipt');
  assert.equal(changed.proofSha256, original.proofSha256);
  assert.notEqual(changed.envelopeSha256, original.envelopeSha256);
  for (const keyid of ['token:sk-abcdefghijkl', 'candidate-plugin-key']) {
    const leaked = structuredClone(renamed);
    leaked.signatures[0].keyid = keyid;
    assert.throws(() => parseRegistrationCanaryDsseEnvelope(JSON.stringify(leaked), 'anchor receipt'), /疑似凭据值|字符串侧信道/);
  }
});

test('authorization/consumption collector 对缺失或 null predicate 返回失败而不 crash', () => {
  for (const malformed of [{}, { _type: 'x', subject: [], predicateType: 'x', predicate: null }]) {
    assert.doesNotThrow(() => collectRegistrationCanaryAuthorizationStatementFailures(malformed));
    assert.notDeepEqual(collectRegistrationCanaryAuthorizationStatementFailures(malformed), []);
    assert.doesNotThrow(() => collectRegistrationCanaryConsumptionStatementFailures(malformed));
    assert.notDeepEqual(collectRegistrationCanaryConsumptionStatementFailures(malformed), []);
  }
});
