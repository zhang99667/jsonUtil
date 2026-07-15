import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initializeGovernanceMcpServer, startGovernanceMcpServer } from '../ci/jsonutilsGovernanceMcpStdioTestClient.mjs';
import { request, serializeMessage } from '../ci/mcpLineDelimitedStdioClient.mjs';

test('MCP stdio rejects invalid requests without terminating the process', async (t) => {
  const { child, readMessage } = startGovernanceMcpServer(t);
  const invalidRequests = [
    [null, null],
    [[], null],
    ['request', null],
    [{ id: 5, method: 'ping' }, 5],
    [{ jsonrpc: '1.0', id: 'bad-version', method: 'ping' }, 'bad-version'],
    [{ jsonrpc: '2.0', id: 7 }, 7],
    [{ jsonrpc: '2.0', id: 8, method: 42 }, 8],
    [{ jsonrpc: '2.0', id: { unsafe: true }, method: null }, null],
    [{ jsonrpc: '2.0', id: 9, method: 'ping', params: 'not-structured' }, 9],
  ];

  for (const [message, expectedId] of invalidRequests) {
    child.stdin.write(serializeMessage(message));
    const response = await readMessage();
    assert.equal(response.id, expectedId);
    assert.deepEqual(response.error, { code: -32600, message: 'Invalid Request' });
  }

  assert.deepEqual((await request(child, readMessage, 10, 'ping')).result, {});
});

test('MCP stdio rejects method and tool params with -32602 then keeps serving', async (t) => {
  const { child, readMessage } = startGovernanceMcpServer(t);
  child.stdin.write(serializeMessage({ jsonrpc: '2.0', id: 20, method: 'initialize', params: {} }));
  assert.deepEqual((await readMessage()).error, { code: -32602, message: 'Invalid params' });
  await initializeGovernanceMcpServer(child, readMessage, 'invalid-params-test');
  const invalidCalls = [
    { jsonrpc: '2.0', id: 21, method: 'resources/read', params: [] },
    { jsonrpc: '2.0', id: 22, method: 'tools/call', params: { name: 'unknown-tool', arguments: {} } },
    { jsonrpc: '2.0', id: 25, method: 'tools/call', params: { name: 'shell', arguments: { command: 'rm -rf .' } } },
    { jsonrpc: '2.0', id: 23, method: 'tools/call', params: { name: 'ai_evaluation_summary', arguments: { limit: 0, extra: true } } },
  ];
  for (const message of invalidCalls) {
    child.stdin.write(serializeMessage(message));
    const response = await readMessage();
    assert.equal(response.id, message.id);
    assert.deepEqual(response.error, { code: -32602, message: 'Invalid params' });
  }
  assert.deepEqual((await request(child, readMessage, 24, 'ping')).result, {});
});

test('MCP stdio suppresses every notification and hides internal errors', async (t) => {
  const { child, readMessage } = startGovernanceMcpServer(t);
  await initializeGovernanceMcpServer(child, readMessage, 'invalid-request-test');
  child.stdin.write([
    serializeMessage({ jsonrpc: '2.0', method: 'unknown-notification' }),
    serializeMessage({
      jsonrpc: '2.0',
      method: 'resources/read',
      params: { uri: 'jsonutils://secret/notification-leak-marker' },
    }),
    serializeMessage({ jsonrpc: '2.0', id: 10, method: 'ping' }),
  ].join(''));

  assert.equal((await readMessage()).id, 10);
  child.stdin.write(serializeMessage({
    jsonrpc: '2.0',
    id: 11,
    method: 'resources/read',
    params: { uri: 'jsonutils://secret/request-leak-marker' },
  }));
  const internalError = await readMessage();
  assert.equal(internalError.id, 11);
  assert.deepEqual(internalError.error, { code: -32603, message: 'Internal error' });
  assert.doesNotMatch(JSON.stringify(internalError), /leak-marker|Unknown resource/);
  assert.deepEqual((await request(child, readMessage, 12, 'ping')).result, {});
});
