import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createRegistrationCanaryAnchorProtocolFixture } from './aiGovernanceRegistrationCanaryAnchorTestFixtures.mjs';
import { selectRegistrationCanaryObservedReceiptJson } from './aiGovernanceRegistrationCanaryReceiptObservation.mjs';

test('receipt observation 只接受固定种类、1 到 16 条紧凑 DSSE', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  for (const receiptKind of ['unknown', '__proto__', 'constructor']) {
    assert.throws(() => selectRegistrationCanaryObservedReceiptJson({
      receiptJsons: [fixture.anchorReceiptJson], receiptKind,
    }), /observation kind 非法/);
  }
  for (const receiptJsons of [[], Array(17).fill(fixture.anchorReceiptJson)]) {
    assert.throws(() => selectRegistrationCanaryObservedReceiptJson({
      receiptJsons, receiptKind: 'anchor',
    }), /必须包含 1 到 16 条记录/);
  }
  for (const receiptJsons of [['{}'], Array(1)]) assert.throws(() => (
    selectRegistrationCanaryObservedReceiptJson({ receiptJsons, receiptKind: 'anchor' })
  ), /闭字段|payloadType|signatures|紧凑 JSON 字符串/);
});

test('receipt observation 按 proof 去重并确定性选择 transport 或预期 signer', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  const renamed = JSON.parse(fixture.anchorReceiptJson);
  renamed.signatures[0].keyid = 'renamed-transport-hint';
  const renamedJson = JSON.stringify(renamed);
  const expected = [fixture.anchorReceiptJson, renamedJson].sort()[0];
  const select = (receiptJsons, preferredSignerKeyId) => selectRegistrationCanaryObservedReceiptJson({
    receiptJsons, receiptKind: 'anchor', preferredSignerKeyId,
  });
  assert.equal(select([fixture.anchorReceiptJson, renamedJson]), expected);
  assert.equal(select([renamedJson, fixture.anchorReceiptJson]), expected);
  assert.equal(select([fixture.anchorReceiptJson, renamedJson], renamed.signatures[0].keyid), renamedJson);
  assert.equal(select([renamedJson, fixture.anchorReceiptJson], 'missing-signer'), expected);
});

test('receipt observation 对三类真实 proof 分歧保留固定冲突诊断', () => {
  const fixture = createRegistrationCanaryAnchorProtocolFixture();
  for (const [receiptKind, receiptJsons, expected] of [
    ['anchor', [fixture.anchorReceiptJson, fixture.authorizationReceiptJson], /anchor 分叉或非幂等重签/],
    ['authorization', [fixture.authorizationReceiptJson, fixture.consumptionReceiptJson], /双授权或双消费/],
    ['consumption', [fixture.consumptionReceiptJson, fixture.anchorReceiptJson], /双授权或双消费/],
  ]) assert.throws(() => selectRegistrationCanaryObservedReceiptJson({ receiptJsons, receiptKind }), expected);
});
