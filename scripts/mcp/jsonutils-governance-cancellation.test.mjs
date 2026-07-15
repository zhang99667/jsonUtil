import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createJsonutilsGovernanceMessageHandler } from './jsonutils-governance-session.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
const resultFor = message => ({ jsonrpc: '2.0', id: message.id, result: { method: message.method } });
const initialize = async (handleMessage, writes) => {
  await handleMessage({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } },
  });
  await handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' });
  writes.length = 0;
};

const createDeferredHarness = () => {
  const jobs = new Map();
  const writes = [];
  const handleRequest = (message, { signal } = {}) => {
    if (message.method !== 'tools/call') return resultFor(message);
    return new Promise((resolve, reject) => {
      const job = { signal, abortCount: 0, resolve: () => resolve(resultFor(message)) };
      signal.addEventListener('abort', () => {
        job.abortCount += 1;
        reject(Object.assign(new Error('cancelled'), { name: 'AbortError' }));
      }, { once: true });
      jobs.set(message.id, job);
    });
  };
  const handleMessage = createJsonutilsGovernanceMessageHandler({
    handleRequest,
    writeMessage: message => writes.push(message),
  });
  return { handleMessage, jobs, writes };
};

test('active cancellation aborts one request, suppresses its response and keeps the session usable', async () => {
  const { handleMessage, jobs, writes } = createDeferredHarness();
  await initialize(handleMessage, writes);
  await handleMessage({ jsonrpc: '2.0', id: 41, method: 'tools/call', params: {} });
  await tick();
  assert.equal(jobs.get(41).signal.aborted, false);

  await handleMessage({
    jsonrpc: '2.0', method: 'notifications/cancelled',
    params: { requestId: 41, reason: 'redacted-test-reason' },
  });
  await tick();
  assert.equal(jobs.get(41).signal.aborted, true);
  assert.equal(jobs.get(41).abortCount, 1);
  assert.deepEqual(writes, []);

  await handleMessage({ jsonrpc: '2.0', id: 42, method: 'ping' });
  await tick();
  assert.deepEqual(writes.map(item => item.id), [42]);
  assert.doesNotMatch(JSON.stringify(writes), /redacted-test-reason/);
});

test('typed IDs stay isolated while duplicate, unknown, completed and malformed cancellation fail safely', async () => {
  const { handleMessage, jobs, writes } = createDeferredHarness();
  await initialize(handleMessage, writes);
  await handleMessage({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: {} });
  await handleMessage({ jsonrpc: '2.0', id: '7', method: 'tools/call', params: {} });
  await tick();
  await handleMessage({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: {} });
  assert.deepEqual(writes.pop()?.error, { code: -32600, message: 'Invalid Request' });

  await handleMessage({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 7 } });
  jobs.get('7').resolve();
  await tick();
  assert.equal(jobs.get(7).abortCount, 1);
  assert.equal(jobs.get('7').abortCount, 0);
  assert.deepEqual(writes.map(item => item.id), ['7']);
  writes.length = 0;

  for (const params of [{ requestId: 999 }, { requestId: '7' }, {}, [], { requestId: 7, reason: 1 }]) {
    await handleMessage({ jsonrpc: '2.0', method: 'notifications/cancelled', params });
  }
  await handleMessage({
    jsonrpc: '2.0', id: 8, method: 'notifications/cancelled', params: { requestId: 999 },
  });
  await handleMessage({ jsonrpc: '2.0', id: 9, method: 'ping' });
  await tick();
  assert.deepEqual(writes, [
    { jsonrpc: '2.0', id: 8, error: { code: -32600, message: 'Invalid Request' } },
    { jsonrpc: '2.0', id: 9, result: { method: 'ping' } },
  ]);
});

test('initialize remains ordered and cannot be cancelled', async () => {
  const writes = [];
  let resolveInitialize;
  let initializeOptions;
  const handleMessage = createJsonutilsGovernanceMessageHandler({
    handleRequest: (message, options) => {
      if (message.method !== 'initialize') return resultFor(message);
      initializeOptions = options;
      return new Promise(resolve => { resolveInitialize = () => resolve(resultFor(message)); });
    },
    writeMessage: message => writes.push(message),
  });
  const initializePending = handleMessage({
    jsonrpc: '2.0', id: 11, method: 'initialize',
    params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } },
  });
  const cancelPending = handleMessage({
    jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 11 },
  });
  await tick();
  assert.equal(initializeOptions, undefined);
  assert.deepEqual(writes, []);
  resolveInitialize();
  await Promise.all([initializePending, cancelPending]);
  assert.deepEqual(writes.map(item => item.id), [11]);

  await handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' });
  await handleMessage({ jsonrpc: '2.0', id: 12, method: 'ping' });
  await tick();
  assert.deepEqual(writes.map(item => item.id), [11, 12]);
});

test('completion wins a late race while session close aborts every remaining job without responses', async () => {
  const { handleMessage, jobs, writes } = createDeferredHarness();
  await initialize(handleMessage, writes);
  await handleMessage({ jsonrpc: '2.0', id: 90, method: 'tools/call', params: {} });
  await handleMessage({ jsonrpc: '2.0', id: 91, method: 'tools/call', params: {} });
  await tick();
  jobs.get(90).resolve();
  await tick();
  await handleMessage({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 90 } });
  assert.deepEqual(writes.map(item => item.id), [90]);

  handleMessage.close();
  await tick();
  assert.equal(jobs.get(91).abortCount, 1);
  assert.deepEqual(writes.map(item => item.id), [90]);
});
