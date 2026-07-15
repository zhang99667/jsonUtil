import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startGovernanceMcpServer } from '../ci/jsonutilsGovernanceMcpStdioTestClient.mjs';
import { request, serializeMessage } from '../ci/mcpLineDelimitedStdioClient.mjs';

const initializeParams = protocolVersion => ({
  protocolVersion,
  capabilities: {},
  clientInfo: { name: 'jsonutils-governance-test', version: '1.0.0' },
});

test('MCP stdio negotiates supported versions and falls back to latest', async (t) => {
  for (const protocolVersion of ['2025-11-25', '2025-06-18', '2024-11-05']) {
    const { child, readMessage } = startGovernanceMcpServer(t);
    const response = await request(child, readMessage, 1, 'initialize', initializeParams(protocolVersion));
    assert.equal(response.result.protocolVersion, protocolVersion);
    assert.equal(response.result.serverInfo.version, '0.3.0');
  }

  const { child, readMessage } = startGovernanceMcpServer(t);
  const response = await request(child, readMessage, 1, 'initialize', initializeParams('2099-01-01'));
  assert.equal(response.result.protocolVersion, '2025-11-25');
});

test('MCP stdio handles multiple lines, parse errors and notifications', async (t) => {
  const { child, readMessage, getStdout } = startGovernanceMcpServer(t);
  await request(child, readMessage, 1, 'initialize', initializeParams('2025-11-25'));
  child.stdin.write([
    serializeMessage({ jsonrpc: '2.0', id: 2, method: 'ping' }),
    serializeMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    serializeMessage({ jsonrpc: '2.0', method: 'ping' }),
    serializeMessage({ jsonrpc: '2.0', id: 3, method: 'ping' }),
  ].join(''));

  assert.equal((await readMessage()).id, 2);
  assert.equal((await readMessage()).id, 3);
  child.stdin.write('not-json\n');
  child.stdin.write(serializeMessage({ jsonrpc: '2.0', id: 4, method: 'ping' }));
  const parseError = await readMessage();
  assert.equal(parseError.id, null);
  assert.equal(parseError.error.code, -32700);
  assert.equal((await readMessage()).id, 4);
  const stdout = getStdout();
  const lines = stdout.trimEnd().split('\n');
  assert.equal(lines.length, 5);
  assert.doesNotMatch(stdout, /Content-Length/i);
  for (const line of lines) assert.doesNotThrow(() => JSON.parse(line));
});
