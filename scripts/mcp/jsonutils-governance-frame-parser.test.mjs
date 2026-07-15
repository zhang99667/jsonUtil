import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createMcpLineParser,
  MAX_MCP_MESSAGE_BYTES,
  serializeMcpMessage,
} from './jsonutils-governance-server.mjs';

test('MCP line parser preserves UTF-8 split across byte chunks', () => {
  const messages = [];
  const parseLine = createMcpLineParser(message => messages.push(message));
  const message = { jsonrpc: '2.0', id: 1, method: '测试' };
  const bytes = Buffer.from(serializeMcpMessage(message));
  const multibyteStart = bytes.indexOf(Buffer.from('测'));

  parseLine(bytes.subarray(0, multibyteStart + 1));
  assert.deepEqual(messages, []);
  parseLine(bytes.subarray(multibyteStart + 1));

  assert.deepEqual(messages, [message]);
});

test('MCP line parser accepts multiple JSON-RPC messages in one chunk', () => {
  const messages = [];
  const parseLine = createMcpLineParser(message => messages.push(message));
  const first = { jsonrpc: '2.0', id: 1, method: 'ping' };
  const second = { jsonrpc: '2.0', id: 2, method: 'ping' };

  parseLine(Buffer.from(serializeMcpMessage(first) + serializeMcpMessage(second)));

  assert.deepEqual(messages, [first, second]);
});

test('MCP message serialization is one JSON line without headers', () => {
  const message = { jsonrpc: '2.0', id: 1, result: {} };
  const serialized = serializeMcpMessage(message);

  assert.equal(serialized, `${JSON.stringify(message)}\n`);
  assert.doesNotMatch(serialized, /Content-Length/i);
});

test('MCP line parser rejects oversized unterminated input and recovers', () => {
  const messages = [];
  let parseErrors = 0;
  const parse = createMcpLineParser(message => messages.push(message), () => { parseErrors += 1; });
  parse(Buffer.alloc(MAX_MCP_MESSAGE_BYTES + 1, 0x61));
  parse(Buffer.from('{"jsonrpc":"2.0","id":1,"method":"ping"}\n'));
  assert.equal(parseErrors, 1);
  assert.deepEqual(messages, [{ jsonrpc: '2.0', id: 1, method: 'ping' }]);
});
