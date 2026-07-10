import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMcpFrameParser } from './jsonutils-governance-server.mjs';

test('MCP frame parser accepts content-length framed JSON messages', () => {
  const messages = [];
  const parseFrame = createMcpFrameParser(message => messages.push(message));
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' });
  const frame = Buffer.from(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);

  parseFrame(frame.subarray(0, 12));
  parseFrame(frame.subarray(12));

  assert.deepEqual(messages, [{ jsonrpc: '2.0', id: 1, method: 'ping' }]);
});
