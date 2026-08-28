import assert from 'node:assert/strict';
import test from 'node:test';

import { isOuterSandboxUnavailable } from './seatbelt-sentinel-test-host.mjs';

test('Seatbelt host gate 只识别精确的外层 sandbox 阻断', () => {
  const blocked = {
    status: 71,
    error: undefined,
    signal: null,
    stdout: '',
    stderr: 'sandbox-exec: sandbox_apply: Operation not permitted\n',
  };
  assert.equal(isOuterSandboxUnavailable(blocked), true);
  assert.equal(isOuterSandboxUnavailable({ ...blocked, status: 73 }), false);
  assert.equal(isOuterSandboxUnavailable({ ...blocked, stderr: 'sandbox-exec failed\n' }), false);
});
