import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  AI_EVOLUTION_FEEDBACK_INBOX_MAX_BYTES,
  AI_EVOLUTION_FEEDBACK_MAX_LINE_BYTES,
  AI_EVOLUTION_FEEDBACK_MAX_PHYSICAL_LINES,
  AI_EVOLUTION_FEEDBACK_MAX_RECORDS,
  readEvolutionFeedbackSource,
} from './aiGovernanceEvolutionFeedbackSource.mjs';
import { readEvolutionFeedbackInbox } from './aiGovernanceEvolutionFeedbackInbox.mjs';

const withTempDir = callback => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'feedback-source-'));
  try { return callback(tempDir); }
  finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
};

const writeInbox = (tempDir, value) => {
  const file = path.join(tempDir, 'feedback-inbox.jsonl');
  fs.writeFileSync(file, value);
  return file;
};

test('feedback source 拒绝 symlink、hardlink 且使用无值诊断', {
  skip: process.platform === 'win32',
}, () => withTempDir((tempDir) => {
  const missing = path.join(tempDir, 'synthetic-secret-marker', 'feedback-inbox.jsonl');
  assert.deepEqual(readEvolutionFeedbackSource(missing).failures, [
    'feedback-inbox.jsonl: 无法读取稳定的有界普通文件',
  ]);

  const target = writeInbox(tempDir, '{}\n');
  const symlink = path.join(tempDir, 'feedback-symlink.jsonl');
  fs.symlinkSync(target, symlink);
  const linked = readEvolutionFeedbackSource(symlink);
  assert.deepEqual(linked.failures, ['feedback-inbox.jsonl: 无法读取稳定的有界普通文件']);
  assert.deepEqual(linked.entries, []);
  assert.equal(linked.failures.join('\n').includes(tempDir), false);

  const hardlink = path.join(tempDir, 'feedback-hardlink.jsonl');
  fs.linkSync(target, hardlink);
  assert.deepEqual(readEvolutionFeedbackSource(hardlink).failures, [
    'feedback-inbox.jsonl: 无法读取稳定的有界普通文件',
  ]);
}));

test('feedback source 拒绝非法 UTF-8、BOM 与超总量输入', () => withTempDir((tempDir) => {
  assert.deepEqual(
    readEvolutionFeedbackSource(writeInbox(tempDir, Buffer.from([0x7b, 0xff, 0x7d]))).failures,
    ['feedback-inbox.jsonl: 必须是合法 UTF-8'],
  );
  assert.deepEqual(
    readEvolutionFeedbackSource(writeInbox(
      tempDir,
      Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('{}\n')]),
    )).failures,
    ['feedback-inbox.jsonl: 禁止 UTF-8 BOM'],
  );
  assert.deepEqual(
    readEvolutionFeedbackSource(writeInbox(
      tempDir,
      Buffer.alloc(AI_EVOLUTION_FEEDBACK_INBOX_MAX_BYTES + 1, 0x20),
    )).failures,
    ['feedback-inbox.jsonl: 无法读取稳定的有界普通文件'],
  );
}));

test('feedback source 有界处理单行、物理行与非空记录', () => withTempDir((tempDir) => {
  assert.deepEqual(
    readEvolutionFeedbackSource(writeInbox(
      tempDir,
      `${' '.repeat(AI_EVOLUTION_FEEDBACK_MAX_LINE_BYTES + 1)}\n`,
    )).failures,
    [`feedback-inbox.jsonl: 第 1 行超过 ${AI_EVOLUTION_FEEDBACK_MAX_LINE_BYTES / 1024} KiB`],
  );
  assert.deepEqual(
    readEvolutionFeedbackSource(writeInbox(
      tempDir,
      '\n'.repeat(AI_EVOLUTION_FEEDBACK_MAX_PHYSICAL_LINES + 1),
    )).failures,
    [`feedback-inbox.jsonl: 物理行数不能超过 ${AI_EVOLUTION_FEEDBACK_MAX_PHYSICAL_LINES}`],
  );
  assert.deepEqual(
    readEvolutionFeedbackSource(writeInbox(
      tempDir,
      '{}\n'.repeat(AI_EVOLUTION_FEEDBACK_MAX_RECORDS + 1),
    )).failures,
    [`feedback-inbox.jsonl: 非空记录数不能超过 ${AI_EVOLUTION_FEEDBACK_MAX_RECORDS}`],
  );
}));

test('feedback source 固定 JSON 诊断并让 inbox 清空可消费状态', () => withTempDir((tempDir) => {
  const file = writeInbox(tempDir, '\nnot-json\n{}\n');
  const source = readEvolutionFeedbackSource(file);
  assert.deepEqual(source.failures, ['feedback-inbox.jsonl: 第 2 行不是合法 JSON']);
  assert.equal(source.entries.length, 2);
  assert.equal(source.entries[0].parsed, false);
  assert.equal(source.entries[1].lineNumber, 3);

  const report = readEvolutionFeedbackInbox(file, { casesById: new Map(), maxDate: '2026-07-15' });
  assert.deepEqual(report.validEvents, []);
  assert.equal(report.states.size, 0);
  assert.equal(report.failures.join('\n').includes('not-json'), false);
}));
