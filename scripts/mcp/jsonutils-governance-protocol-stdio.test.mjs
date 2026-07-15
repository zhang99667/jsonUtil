import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startGovernanceMcpServer } from '../ci/jsonutilsGovernanceMcpStdioTestClient.mjs';
import { request, serializeMessage } from '../ci/mcpLineDelimitedStdioClient.mjs';
import { createMcpLineParser, JSONUTILS_GOVERNANCE_INSTRUCTIONS } from './jsonutils-governance-server.mjs';

const initializeParams = protocolVersion => ({
  protocolVersion,
  capabilities: {},
  clientInfo: { name: 'jsonutils-governance-test', version: '1.0.0' },
});

test('MCP stdio negotiates supported versions and falls back to latest', async (t) => {
  assert.ok(Buffer.byteLength(JSONUTILS_GOVERNANCE_INSTRUCTIONS, 'utf8') <= 512);
  assert.match(JSONUTILS_GOVERNANCE_INSTRUCTIONS, /marketplace discovery/);
  assert.match(JSONUTILS_GOVERNANCE_INSTRUCTIONS, /never installs plugins/);
  for (const protocolVersion of ['2025-11-25', '2025-06-18', '2024-11-05']) {
    const { child, readMessage } = startGovernanceMcpServer(t);
    const response = await request(child, readMessage, 1, 'initialize', initializeParams(protocolVersion));
    assert.equal(response.result.protocolVersion, protocolVersion);
    assert.equal(response.result.serverInfo.version, '0.6.0');
    assert.equal(response.result.instructions, JSONUTILS_GOVERNANCE_INSTRUCTIONS);
  }

  const { child, readMessage } = startGovernanceMcpServer(t);
  const response = await request(child, readMessage, 1, 'initialize', initializeParams('2099-01-01'));
  assert.equal(response.result.protocolVersion, '2025-11-25');
  assert.equal(response.result.instructions, JSONUTILS_GOVERNANCE_INSTRUCTIONS);
});

test('MCP stdio rejects malformed UTF-8 and enforces initialization order', async (t) => {
  const messages = [];
  let parseErrors = 0;
  const parse = createMcpLineParser(message => messages.push(message), () => { parseErrors += 1; });
  parse(Buffer.concat([Buffer.from('{"jsonrpc":"2.0","id":1,"method":"'), Buffer.from([0xff]), Buffer.from('"}\n')]));
  parse(Buffer.from('{"jsonrpc":"2.0","id":2,"method":"ping"}\n'));
  assert.deepEqual([parseErrors, messages[0]?.id], [1, 2]);

  const { child, readMessage } = startGovernanceMcpServer(t);
  assert.equal((await request(child, readMessage, 30, 'tools/list')).error.code, -32002);
  await request(child, readMessage, 31, 'initialize', initializeParams('2025-11-25'));
  child.stdin.write(serializeMessage({ jsonrpc: '2.0', method: 'notifications/initialized', params: [] }));
  assert.equal((await request(child, readMessage, 32, 'tools/list')).error.code, -32002);
  const requestShaped = await request(child, readMessage, 33, 'notifications/initialized', {});
  assert.deepEqual(requestShaped.error, { code: -32600, message: 'Invalid Request' });
  assert.equal((await request(child, readMessage, 34, 'resources/list')).error.code, -32002);
  child.stdin.write([
    serializeMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    serializeMessage({ jsonrpc: '2.0', id: 35, method: 'tools/list' }),
  ].join(''));
  assert.ok((await readMessage()).result.tools.length > 0);
  const duplicate = await request(child, readMessage, 36, 'initialize', initializeParams('2025-11-25'));
  assert.deepEqual(duplicate.error, { code: -32600, message: 'Invalid Request' });
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
