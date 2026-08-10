import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  JsonRpcInvalidParamsError,
  assertJsonutilsGovernanceMethodParams,
} from './jsonutils-governance-method-params.mjs';

const assertInvalid = (method, params) => assert.throws(
  () => assertJsonutilsGovernanceMethodParams(method, params),
  JsonRpcInvalidParamsError,
);

test('method params accepts the fixed MCP request shapes', () => {
  assert.doesNotThrow(() => assertJsonutilsGovernanceMethodParams('initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' },
  }));
  assert.doesNotThrow(() => assertJsonutilsGovernanceMethodParams('resources/read', { uri: 'jsonutils://ai/context' }));
  assert.doesNotThrow(() => assertJsonutilsGovernanceMethodParams('tools/call', {}));
  for (const method of ['ping', 'resources/list', 'tools/list', 'notifications/initialized']) {
    assert.doesNotThrow(() => assertJsonutilsGovernanceMethodParams(method, undefined));
    assert.doesNotThrow(() => assertJsonutilsGovernanceMethodParams(method, {}));
  }
});

test('method params rejects malformed initialization and structured request params', () => {
  for (const params of [undefined, {}, { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: {} }]) {
    assertInvalid('initialize', params);
  }
  for (const params of [undefined, null, [], { uri: '' }]) assertInvalid('resources/read', params);
  for (const params of [undefined, null, []]) assertInvalid('tools/call', params);
  for (const method of ['ping', 'resources/list', 'tools/list', 'notifications/initialized']) {
    for (const params of [null, []]) assertInvalid(method, params);
  }
});

test('cancellation params preserve typed IDs and reject open or malformed shapes', () => {
  for (const params of [{ requestId: '7' }, { requestId: 7, reason: '' }]) {
    assert.doesNotThrow(() => assertJsonutilsGovernanceMethodParams('notifications/cancelled', params));
  }
  for (const params of [
    undefined,
    {},
    { requestId: null },
    { requestId: Number.POSITIVE_INFINITY },
    { requestId: 7, reason: 1 },
    { requestId: 7, extra: true },
  ]) assertInvalid('notifications/cancelled', params);
});
