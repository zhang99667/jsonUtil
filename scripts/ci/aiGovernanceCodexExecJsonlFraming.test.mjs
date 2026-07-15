import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CODEX_EXEC_MAX_JSONL_EVENTS,
  CODEX_EXEC_MAX_JSONL_LINE_BYTES,
  createCodexExecJsonlFramer,
} from './aiGovernanceCodexExecJsonlFraming.mjs';

const jsonLineOfSize = (size) => {
  const prefix = '{"value":"';
  const suffix = '"}';
  return Buffer.from(`${prefix}${'x'.repeat(size - prefix.length - suffix.length)}${suffix}`);
};

const createCapture = () => {
  const values = [];
  const drops = [];
  const framer = createCodexExecJsonlFramer({
    onValue: value => values.push(value),
    onDropEvent: code => drops.push(code),
  });
  return { framer, values, drops };
};

test('JSONL framing 接受精确单行上限与 CRLF，并保持逐字节分块等价', () => {
  const exact = createCapture();
  exact.framer.push(Buffer.concat([
    jsonLineOfSize(CODEX_EXEC_MAX_JSONL_LINE_BYTES),
    Buffer.from('\n'),
  ]));
  exact.framer.finalize();
  assert.equal(exact.values.length, 1);
  assert.deepEqual(exact.drops, []);

  const bytewise = createCapture();
  const input = Buffer.from('{"first":1}\r\n{"second":2}\n');
  for (const byte of input) bytewise.framer.push(Buffer.from([byte]));
  bytewise.framer.finalize();
  assert.deepEqual(bytewise.values, [{ first: 1 }, { second: 2 }]);
  assert.deepEqual(bytewise.drops, []);
});

test('单 chunk 与跨 chunk 超长行只各丢弃一次，并从下一行恢复', () => {
  for (const chunks of [
    [Buffer.concat([
      jsonLineOfSize(CODEX_EXEC_MAX_JSONL_LINE_BYTES + 1),
      Buffer.from('\n{"after":"single"}\n'),
    ])],
    [
      jsonLineOfSize(700_000).subarray(0, 700_000),
      Buffer.concat([
        Buffer.alloc(CODEX_EXEC_MAX_JSONL_LINE_BYTES - 699_999, 120),
        Buffer.from('\n{"after":"split"}\n'),
      ]),
    ],
  ]) {
    const capture = createCapture();
    for (const chunk of chunks) capture.framer.push(chunk);
    capture.framer.finalize();
    assert.equal(capture.values.length, 1);
    assert.ok(['single', 'split'].includes(capture.values[0].after));
    assert.deepEqual(capture.drops, ['dropped-events']);
  }

  const discardedRemainder = createCapture();
  discardedRemainder.framer.push(Buffer.alloc(CODEX_EXEC_MAX_JSONL_LINE_BYTES + 1, 120));
  discardedRemainder.framer.push(Buffer.from('still-discarded\n{"after":"recovered"}\n'));
  discardedRemainder.framer.finalize();
  assert.deepEqual(discardedRemainder.values, [{ after: 'recovered' }]);
  assert.deepEqual(discardedRemainder.drops, ['dropped-events']);
});

test('未终止超长行同时记录丢弃与截断，且不保留正文', () => {
  const capture = createCapture();
  capture.framer.push(Buffer.alloc(CODEX_EXEC_MAX_JSONL_LINE_BYTES + 1, 120));
  capture.framer.finalize();
  assert.deepEqual(capture.values, []);
  assert.deepEqual(capture.drops, ['dropped-events', 'truncated-jsonl']);
});

test('空行、非法 UTF-8 与坏 JSON 固定映射为 malformed-jsonl', () => {
  const capture = createCapture();
  capture.framer.push(Buffer.from('\n'));
  capture.framer.push(Buffer.from([0xff, 0x0a]));
  capture.framer.push(Buffer.from('{bad}\n'));
  capture.framer.finalize();
  assert.deepEqual(capture.values, []);
  assert.deepEqual(capture.drops, [
    'malformed-jsonl', 'malformed-jsonl', 'malformed-jsonl',
  ]);
});

test('JSONL 事件计数上限不会被额外行绕过', () => {
  const capture = createCapture();
  const line = Buffer.from('{"ok":true}\n');
  capture.framer.push(Buffer.concat(Array.from(
    { length: CODEX_EXEC_MAX_JSONL_EVENTS + 1 },
    () => line,
  )));
  capture.framer.finalize();
  assert.equal(capture.values.length, CODEX_EXEC_MAX_JSONL_EVENTS);
  assert.deepEqual(capture.drops, ['dropped-events']);
});
