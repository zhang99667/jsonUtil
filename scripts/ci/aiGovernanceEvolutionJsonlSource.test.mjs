import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionJsonlSource } from './aiGovernanceEvolutionJsonlSource.mjs';

const limits = {
  label: 'fixture.jsonl',
  maxBytes: 16 * 1024,
  maxLineBytes: 4 * 1024,
  maxPhysicalLines: 4,
  maxRecords: 2,
};

const withTempDir = callback => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evolution-jsonl-source-'));
  try { return callback(tempDir); }
  finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
};

const writeSource = (tempDir, value, name = 'fixture.jsonl') => {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, value);
  return file;
};

test('evolution JSONL source 按物理行保留 CRLF 与空行 framing', () => withTempDir((tempDir) => {
  const file = writeSource(tempDir, ' \r\n{"first":1}\r\n\n{"second":2}');
  assert.deepEqual(readEvolutionJsonlSource(file, limits), {
    lines: [
      { line: '{"first":1}', lineNumber: 2, ordinal: 1 },
      { line: '{"second":2}', lineNumber: 4, ordinal: 2 },
    ],
  });
}));

test('evolution JSONL source 统一拒绝不稳定节点', {
  skip: process.platform === 'win32',
}, () => withTempDir((tempDir) => {
  const missing = path.join(tempDir, 'synthetic-secret-marker', 'fixture.jsonl');
  assert.deepEqual(readEvolutionJsonlSource(missing, limits), {
    lines: [], failure: 'fixture.jsonl: 无法读取稳定的有界普通文件',
  });

  const target = writeSource(tempDir, '{}\n');
  const symlink = path.join(tempDir, 'fixture-link.jsonl');
  fs.symlinkSync(target, symlink);
  assert.deepEqual(readEvolutionJsonlSource(symlink, limits), {
    lines: [], failure: 'fixture.jsonl: 无法读取稳定的有界普通文件',
  });

  const hardlink = path.join(tempDir, 'fixture-hardlink.jsonl');
  fs.linkSync(target, hardlink);
  assert.deepEqual(readEvolutionJsonlSource(hardlink, limits), {
    lines: [], failure: 'fixture.jsonl: 无法读取稳定的有界普通文件',
  });
}));

test('evolution JSONL source 统一拒绝 BOM 与非法 UTF-8', () => withTempDir((tempDir) => {
  const bom = writeSource(tempDir, Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d]), 'bom.jsonl');
  assert.deepEqual(readEvolutionJsonlSource(bom, limits), {
    lines: [], failure: 'fixture.jsonl: 禁止 UTF-8 BOM',
  });

  const invalidUtf8 = writeSource(tempDir, Buffer.from([0x7b, 0xff, 0x7d]), 'invalid.jsonl');
  assert.deepEqual(readEvolutionJsonlSource(invalidUtf8, limits), {
    lines: [], failure: 'fixture.jsonl: 必须是合法 UTF-8',
  });
}));

test('evolution JSONL source 统一执行总量、单行、物理行与记录上限', () => withTempDir((tempDir) => {
  const oversized = writeSource(tempDir, Buffer.alloc(limits.maxBytes + 1, 0x20), 'oversized.jsonl');
  assert.deepEqual(readEvolutionJsonlSource(oversized, limits), {
    lines: [], failure: 'fixture.jsonl: 无法读取稳定的有界普通文件',
  });

  const longLine = writeSource(tempDir, `${' '.repeat(limits.maxLineBytes + 1)}\n`, 'long-line.jsonl');
  assert.deepEqual(readEvolutionJsonlSource(longLine, limits), {
    lines: [], failure: 'fixture.jsonl: 第 1 行超过 4 KiB',
  });

  const physicalLines = writeSource(tempDir, '\n'.repeat(limits.maxPhysicalLines), 'physical-lines.jsonl');
  assert.deepEqual(readEvolutionJsonlSource(physicalLines, limits), {
    lines: [], failure: 'fixture.jsonl: 物理行数不能超过 4',
  });

  const records = writeSource(tempDir, '{}\n'.repeat(limits.maxRecords + 1), 'records.jsonl');
  assert.deepEqual(readEvolutionJsonlSource(records, limits), {
    lines: [], failure: 'fixture.jsonl: 非空记录数不能超过 2',
  });
}));
