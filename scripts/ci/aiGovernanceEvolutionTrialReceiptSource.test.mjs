import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionTrialReceiptLedger } from './aiGovernanceEvolutionTrialReceipts.mjs';

const MAX_LEDGER_BYTES = 8 * 1024 * 1024;
const MAX_PHYSICAL_LINES = 8192;
const MAX_RECORDS = 4096;
const projectRoot = path.resolve(import.meta.dirname, '../..');
const options = { rootDir: projectRoot, maxDate: '2026-07-15' };

const validReceipt = (overrides = {}) => ({
  schemaVersion: 1,
  id: 'receipt-source-fixture',
  artifactType: 'ai-evolution-trial-receipt',
  dataClass: 'redacted',
  caseId: 'receipt-source-fixture',
  corpusVersion: '1.0.0',
  caseVersion: 1,
  subjectVersion: '1.0.0',
  evaluatedAt: '2026-07-15',
  method: 'human',
  source: 'manual',
  runner: 'manual-review',
  revision: 'a'.repeat(40),
  aggregation: 'all-pass',
  trialResults: [{
    trial: 1, verdict: 'pass', score: 100, gradeTarget: 'both', evidence: 'fixture passed',
  }],
  validations: [{
    command: 'manual review', status: 'passed', evidence: 'fixture passed', checkedAt: '2026-07-15',
  }],
  ...overrides,
});

const withTempDir = callback => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trial-receipt-source-'));
  try { return callback(tempDir); }
  finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
};

const writeLedger = (tempDir, value) => {
  const file = path.join(tempDir, 'trial-receipts.jsonl');
  fs.writeFileSync(file, value);
  return file;
};

test('trial receipt source 拒绝 symlink 且不反射路径诊断', () => withTempDir((tempDir) => {
  const missing = path.join(tempDir, 'synthetic-secret-marker', 'trial-receipts.jsonl');
  const missingResult = readEvolutionTrialReceiptLedger(missing, options);
  assert.deepEqual(missingResult.failures, ['trial-receipts.jsonl: 无法读取稳定的有界普通文件']);
  assert.equal(missingResult.failures.join('\n').includes(tempDir), false);

  const target = writeLedger(tempDir, `${JSON.stringify(validReceipt())}\n`);
  const link = path.join(tempDir, 'trial-receipts-link.jsonl');
  fs.symlinkSync(target, link);
  const linkedResult = readEvolutionTrialReceiptLedger(link, options);
  assert.deepEqual(linkedResult.failures, ['trial-receipts.jsonl: 无法读取稳定的有界普通文件']);
  assert.deepEqual(linkedResult.receipts, []);
  assert.deepEqual(linkedResult.validReceipts, []);

  const hardlink = path.join(tempDir, 'trial-receipts-hardlink.jsonl');
  fs.linkSync(target, hardlink);
  assert.deepEqual(
    readEvolutionTrialReceiptLedger(hardlink, options).failures,
    ['trial-receipts.jsonl: 无法读取稳定的有界普通文件'],
  );
}));

test('trial receipt source 拒绝非法 UTF-8、BOM 与超限文件', () => withTempDir((tempDir) => {
  const marker = 'node-invalid-byte-marker';
  const encoded = JSON.stringify(validReceipt({
    trialResults: [{
      trial: 1, verdict: 'pass', score: 100, gradeTarget: 'both', evidence: marker,
    }],
  }));
  const [left, right] = encoded.split(marker);
  const invalidUtf8 = writeLedger(
    tempDir,
    Buffer.concat([Buffer.from(left), Buffer.from([0xff]), Buffer.from(right)]),
  );
  assert.deepEqual(
    readEvolutionTrialReceiptLedger(invalidUtf8, options).failures,
    ['trial-receipts.jsonl: 必须是合法 UTF-8'],
  );

  const bom = writeLedger(
    tempDir,
    Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(`${JSON.stringify(validReceipt())}\n`)]),
  );
  assert.match(readEvolutionTrialReceiptLedger(bom, options).failures.join('\n'), /第 1 行不是合法 JSON/);

  const oversized = writeLedger(tempDir, Buffer.alloc(MAX_LEDGER_BYTES + 1, 0x20));
  assert.deepEqual(
    readEvolutionTrialReceiptLedger(oversized, options).failures,
    ['trial-receipts.jsonl: 无法读取稳定的有界普通文件'],
  );
}));

test('trial receipt source 有界处理物理行与非空记录', () => withTempDir((tempDir) => {
  const excessiveLines = writeLedger(tempDir, '\n'.repeat(MAX_PHYSICAL_LINES + 1));
  assert.deepEqual(
    readEvolutionTrialReceiptLedger(excessiveLines, options).failures,
    [`trial-receipts.jsonl: 物理行数不能超过 ${MAX_PHYSICAL_LINES}`],
  );

  const excessiveRecords = writeLedger(tempDir, '{}\n'.repeat(MAX_RECORDS + 1));
  assert.deepEqual(
    readEvolutionTrialReceiptLedger(excessiveRecords, options).failures,
    [`trial-receipts.jsonl: 非空记录数不能超过 ${MAX_RECORDS}`],
  );
}));

test('trial receipt source 结构失败时清空有效索引并计入坏记录', () => withTempDir((tempDir) => {
  const result = readEvolutionTrialReceiptLedger(
    writeLedger(tempDir, `not-json\n${JSON.stringify(validReceipt())}\n`),
    options,
  );
  assert.match(result.failures.join('\n'), /第 1 行不是合法 JSON/);
  assert.deepEqual(result.validReceipts, []);
  assert.equal(result.receiptsById.size, 0);
  assert.equal(result.invalidReceiptCount, 2);
}));
