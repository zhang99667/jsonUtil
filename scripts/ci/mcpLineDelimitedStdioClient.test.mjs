import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';

import { createMessageReader, request } from './mcpLineDelimitedStdioClient.mjs';

const errorMessage = async (promise) => {
  let rejection;
  try {
    await promise;
  } catch (error) {
    rejection = error;
  }
  assert.ok(rejection instanceof Error);
  return rejection.message;
};

test('message reader bounds unterminated stdout without disclosing child output', async () => {
  const stream = new PassThrough();
  const readMessage = createMessageReader(stream, () => 'stderr-secret', { maxBufferedBytes: 8 });
  stream.write('stdout-secret');

  assert.equal(await errorMessage(readMessage()), 'MCP stdout buffer limit exceeded');
});

test('message reader bounds queued messages', async () => {
  const stream = new PassThrough();
  const readMessage = createMessageReader(stream, () => 'stderr-secret', { maxQueuedMessages: 2 });
  stream.write('{"id":1}\n{"id":2}\n{"id":3,"value":"stdout-secret"}\n');

  assert.equal(await errorMessage(readMessage()), 'MCP stdout message queue limit exceeded');
});

test('message reader uses fixed errors for invalid JSON, timeout, EOF, and stream failure', async () => {
  const invalidStream = new PassThrough();
  const readInvalid = createMessageReader(invalidStream, () => 'stderr-secret');
  invalidStream.write('{stdout-secret}\n');
  assert.equal(await errorMessage(readInvalid()), 'Invalid MCP stdout JSON line');

  const timeoutStream = new PassThrough();
  const readTimeout = createMessageReader(timeoutStream, () => 'stderr-secret');
  assert.equal(await errorMessage(readTimeout(5)), 'Timed out waiting for MCP response');

  const endedStream = new PassThrough();
  const readEnded = createMessageReader(endedStream, () => 'stderr-secret');
  endedStream.end();
  assert.equal(await errorMessage(readEnded()), 'MCP stdout ended early');

  const failedStream = new PassThrough();
  const readFailed = createMessageReader(failedStream, () => 'stderr-secret');
  failedStream.emit('error', new Error('stdout-secret'));
  assert.equal(await errorMessage(readFailed()), 'MCP stdout stream failed');
});

test('message reader accepts chunked CRLF messages within configured limits', async () => {
  const stream = new PassThrough();
  const readMessage = createMessageReader(stream, () => '', { maxBufferedBytes: 16, maxQueuedMessages: 1 });
  stream.write('{"id":');
  stream.write('7}\r\n');

  assert.deepEqual(await readMessage(), { id: 7 });
});

test('request requires the matching response id without disclosing the response', async () => {
  let written = '';
  const child = { stdin: { write: value => { written += value; } } };
  const response = await request(child, async () => ({ jsonrpc: '2.0', id: 7, result: {} }), 7, 'ping');
  assert.equal(response.id, 7);
  assert.equal(JSON.parse(written).id, 7);

  const mismatched = request(
    child,
    async () => ({ jsonrpc: '2.0', id: 8, result: { value: 'stdout-secret' } }),
    7,
    'ping',
  );
  assert.equal(await errorMessage(mismatched), 'MCP response id mismatch');

  const wrongVersion = request(child, async () => ({ jsonrpc: '1.0', id: 7 }), 7, 'ping');
  assert.equal(await errorMessage(wrongVersion), 'MCP response envelope mismatch');
});
