import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildRegistrationCanaryAnchorStatement,
  collectRegistrationCanaryAnchorStatementFailures,
  verifyRegistrationCanaryAnchorReceipt,
  verifyRegistrationCanaryAnchorReceiptSet,
} from './aiGovernanceRegistrationCanaryAnchorReceipt.mjs';
import { hashRegistrationCanaryEd25519PublicKey } from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import { createRegistrationCanaryAnchorProtocolFixture } from './aiGovernanceRegistrationCanaryAnchorTestFixtures.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');

test('anchor receipt 绑定 checkpoint 精确字节且签名数学不冒充外部信任', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  assert.deepEqual(collectRegistrationCanaryAnchorStatementFailures(fixture.anchorStatement), []);
  const untrusted = verifyRegistrationCanaryAnchorReceipt({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
  });
  assert.equal(untrusted.verificationStatus, 'valid-untrusted');
  assert.equal(untrusted.signature.signatureVerified, false);
  const verified = verifyRegistrationCanaryAnchorReceipt({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    publicKey: fixture.signers.anchor.publicKey,
  });
  assert.equal(verified.verificationStatus, 'signature-verified-unwitnessed');
  assert.equal(verified.signature.signatureVerified, true);
  assert.equal(verified.evidenceScope, 'component-only');
  assert.deepEqual(verified.trust, {
    trustedSigners: 0,
    identityVerified: false,
    timestampVerified: false,
    inclusionVerified: false,
    consistencyVerified: false,
    nonEquivocationVerified: false,
    externalStateVerified: false,
  });
  assert.deepEqual(verified.writebackCandidate, {
    status: 'blocked', reasonCode: 'external-anchor-witness-required', automaticWrite: false,
  });
});

test('anchor receipt 拒绝 request 漂移、错误签名与非紧凑 envelope', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const changedRequest = JSON.parse(fixture.checkpointRequestJson);
  changedRequest.gradeSet.commitmentSha256 = 'f'.repeat(64);
  assert.throws(() => verifyRegistrationCanaryAnchorReceipt({
    checkpointRequestJson: JSON.stringify(changedRequest),
    anchorReceiptJson: fixture.anchorReceiptJson,
  }), /grade refs digest|不匹配|漂移/);
  const other = createRegistrationCanaryAnchorProtocolFixture();
  assert.throws(() => verifyRegistrationCanaryAnchorReceipt({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    publicKey: other.signers.anchor.publicKey,
  }), /签名验证失败/);
  assert.throws(() => verifyRegistrationCanaryAnchorReceipt({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: `${JSON.stringify(JSON.parse(fixture.anchorReceiptJson), null, 2)}\n`,
  }), /精确紧凑 JSON/);
});

test('anchor Statement 锁定唯一 key、状态与闭字段，拒绝自报时间或信任', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  for (const mutate of [
    changed => { changed.predicate.state.resultVersion = 2; },
    changed => { changed.predicate.anchorKeySha256 = '0'.repeat(64); },
    changed => { changed.predicate.batchId = `batch-${'z'.repeat(32)}`; },
    changed => { changed.predicate.role = 'unblind-authorizer'; },
    changed => { changed.predicate.timestamp = '2026-07-12T00:00:00Z'; },
    changed => { changed.predicate.verified = true; },
    changed => { changed.predicate.controller.policy.id = 'candidate-policy'; },
  ]) {
    const changed = structuredClone(fixture.anchorStatement);
    mutate(changed);
    assert.notDeepEqual(collectRegistrationCanaryAnchorStatementFailures(changed), []);
  }
  assert.throws(() => buildRegistrationCanaryAnchorStatement({
    checkpointRequestJson: fixture.checkpointRequestJson,
    batchId: `batch-${'4'.repeat(32)}`,
    authority: { id: 'external-checkpoint-authority', epoch: 'epoch-1', verified: true },
    controller: {
      bundleSha256: '5'.repeat(64),
      policy: { id: 'external-anchor-policy', version: '1.0.0', sha256: '6'.repeat(64) },
    },
  }), /闭字段/);
});

test('anchor observation set 按签名 proof 去重并拒绝真实可观察分叉', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const repeated = verifyRegistrationCanaryAnchorReceiptSet({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJsons: [fixture.anchorReceiptJson, fixture.anchorReceiptJson],
  });
  assert.equal(repeated.anchorRef.stateVersion, 1);
});

test('anchor collector 对缺失 predicate fail closed，host expected bindings 可独立锁定', () => {
  for (const malformed of [{}, { _type: 'x', subject: [], predicateType: 'x', predicate: null }]) {
    assert.doesNotThrow(() => collectRegistrationCanaryAnchorStatementFailures(malformed));
    assert.notDeepEqual(collectRegistrationCanaryAnchorStatementFailures(malformed), []);
  }
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const predicate = fixture.anchorStatement.predicate;
  const expectedBindings = {
    batchId: predicate.batchId,
    authority: predicate.authority,
    controller: predicate.controller,
    signerKeyId: fixture.signers.anchor.keyid,
    signerPublicKeySha256: hashRegistrationCanaryEd25519PublicKey(fixture.signers.anchor.publicKey),
  };
  const matched = verifyRegistrationCanaryAnchorReceipt({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    publicKey: fixture.signers.anchor.publicKey,
    expectedBindings,
  });
  assert.equal(matched.bindingStatus, 'matched-caller-expected');
  const renamedEnvelope = JSON.parse(fixture.anchorReceiptJson);
  renamedEnvelope.signatures[0].keyid = 'renamed-transport-hint';
  const forwardSet = verifyRegistrationCanaryAnchorReceiptSet({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJsons: [fixture.anchorReceiptJson, JSON.stringify(renamedEnvelope)],
    publicKey: fixture.signers.anchor.publicKey,
    expectedBindings,
  });
  const reverseSet = verifyRegistrationCanaryAnchorReceiptSet({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJsons: [JSON.stringify(renamedEnvelope), fixture.anchorReceiptJson],
    publicKey: fixture.signers.anchor.publicKey,
    expectedBindings,
  });
  assert.deepEqual(reverseSet, forwardSet);
  assert.throws(() => verifyRegistrationCanaryAnchorReceipt({
    checkpointRequestJson: fixture.checkpointRequestJson,
    anchorReceiptJson: fixture.anchorReceiptJson,
    publicKey: fixture.signers.anchor.publicKey,
    expectedBindings: { ...expectedBindings, batchId: `batch-${'f'.repeat(32)}` },
  }), /expectedBindings/);
});

test('anchor protocol 对深嵌套和未知路径使用有界无值诊断', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  let nested = 'safe';
  for (let depth = 0; depth < 2_500; depth += 1) nested = [nested];
  const deep = structuredClone(fixture.anchorStatement);
  deep.predicate.authority.id = nested;
  const deepReceipt = fixture.signStatement(deep, fixture.signers.anchor);
  assert.throws(() => verifyRegistrationCanaryAnchorReceipt({
    checkpointRequestJson: fixture.checkpointRequestJson, anchorReceiptJson: deepReceipt,
  }), error => error instanceof TypeError && /深度或节点上限/.test(error.message));
  const leaked = structuredClone(fixture.anchorStatement);
  leaked['/Users/example/private-anchor-fixture'] = 'authorization=super-secret-value';
  const failures = collectRegistrationCanaryAnchorStatementFailures(leaked).join('\n');
  assert.match(failures, /闭字段|疑似凭据值/);
  assert.doesNotMatch(failures, /Users\/example|super-secret-value/);
});

test('anchor 生产模块不生成/读取私钥、不写状态或账本', () => {
  const files = [
    'scripts/ci/aiGovernanceRegistrationCanaryDsseEnvelope.mjs',
    'scripts/ci/aiGovernanceRegistrationCanaryReceiptObservation.mjs',
    'scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.mjs',
  ];
  const source = files.map(file => fs.readFileSync(path.join(rootDir, file), 'utf8')).join('\n');
  assert.doesNotMatch(source, /generateKey|privateKey|createPrivateKey|readFile|writeFile|appendFile|fetch\(|Date\.now|new Date/);
  assert.doesNotMatch(source, /trustedSigners\s*:\s*[1-9]|identityVerified\s*:\s*true|inclusionVerified\s*:\s*true|nonEquivocationVerified\s*:\s*true/);
});
