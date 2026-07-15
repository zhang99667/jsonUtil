import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionOutcomeLedger } from './aiGovernanceEvolutionOutcomeLedger.mjs';

const MAX_LEDGER_BYTES = 8 * 1024 * 1024;
const MAX_LINE_BYTES = 64 * 1024;
const MAX_PHYSICAL_LINES = 8192;
const MAX_RECORDS = 4096;
const projectRoot = path.resolve(import.meta.dirname, '../..');
const options = {
  rootDir: projectRoot,
  caseIds: new Set(['rule-read-before-write']),
  maxDate: '2026-07-15',
  currentCorpusVersion: '1.0.0',
};

const validOutcome = (overrides = {}) => ({
  schemaVersion: 1,
  id: 'outcome-source-fixture',
  caseId: 'rule-read-before-write',
  corpusVersion: '1.0.0',
  caseVersion: 1,
  subjectVersion: '1.0.0',
  evaluatedAt: '2026-07-15',
  verdict: 'pass',
  score: 100,
  provenance: {
    method: 'deterministic', source: 'local', runner: 'node-test', revision: 'fixture', trials: 1,
  },
  writeback: {
    files: [],
    validationResults: [{
      command: 'node --test fixture', status: 'passed', evidence: 'fixture passed', checkedAt: '2026-07-15',
    }],
  },
  ...overrides,
});

const withTempDir = callback => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'outcome-ledger-source-'));
  try { return callback(tempDir); }
  finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
};

const writeLedger = (tempDir, value) => {
  const file = path.join(tempDir, 'outcomes.jsonl');
  fs.writeFileSync(file, value);
  return file;
};

test('outcome ledger source 拒绝 symlink 并使用无值读取诊断', () => withTempDir((tempDir) => {
  const missing = path.join(tempDir, 'synthetic-secret-marker', 'outcomes.jsonl');
  const missingResult = readEvolutionOutcomeLedger(missing, options);
  assert.deepEqual(missingResult.failures, ['outcomes.jsonl: 无法读取稳定的有界普通文件']);
  assert.equal(missingResult.failures.join('\n').includes(tempDir), false);

  const target = writeLedger(tempDir, `${JSON.stringify(validOutcome())}\n`);
  const link = path.join(tempDir, 'outcomes-link.jsonl');
  fs.symlinkSync(target, link);
  const linkedResult = readEvolutionOutcomeLedger(link, options);
  assert.deepEqual(linkedResult.failures, ['outcomes.jsonl: 无法读取稳定的有界普通文件']);
  assert.deepEqual(linkedResult.outcomes, []);
  assert.deepEqual(linkedResult.validOutcomes, []);
}));

test('outcome ledger source 拒绝非法 UTF-8、超限文件与超限行', () => withTempDir((tempDir) => {
  const marker = 'node-invalid-byte-marker';
  const encoded = JSON.stringify(validOutcome({ provenance: {
    method: 'deterministic', source: 'local', runner: marker, revision: 'fixture', trials: 1,
  } }));
  const [left, right] = encoded.split(marker);
  const invalidUtf8 = writeLedger(tempDir, Buffer.concat([Buffer.from(left), Buffer.from([0xff]), Buffer.from(right)]));
  assert.deepEqual(
    readEvolutionOutcomeLedger(invalidUtf8, options).failures,
    ['outcomes.jsonl: 必须是合法 UTF-8'],
  );

  const oversizedFile = writeLedger(tempDir, Buffer.alloc(MAX_LEDGER_BYTES + 1, 0x20));
  assert.deepEqual(
    readEvolutionOutcomeLedger(oversizedFile, options).failures,
    ['outcomes.jsonl: 无法读取稳定的有界普通文件'],
  );

  const oversizedLine = writeLedger(tempDir, `${' '.repeat(MAX_LINE_BYTES + 1)}\n`);
  assert.deepEqual(
    readEvolutionOutcomeLedger(oversizedLine, options).failures,
    ['outcomes.jsonl: 第 1 行超过 64 KiB'],
  );
}));

test('outcome ledger source 有界处理物理行和非空记录', () => withTempDir((tempDir) => {
  const physicalLines = writeLedger(tempDir, '\n'.repeat(MAX_PHYSICAL_LINES + 1));
  assert.deepEqual(
    readEvolutionOutcomeLedger(physicalLines, options).failures,
    [`outcomes.jsonl: 物理行数不能超过 ${MAX_PHYSICAL_LINES}`],
  );

  const records = writeLedger(tempDir, '{}\n'.repeat(MAX_RECORDS + 1));
  assert.deepEqual(
    readEvolutionOutcomeLedger(records, options).failures,
    [`outcomes.jsonl: 非空记录数不能超过 ${MAX_RECORDS}`],
  );
}));

test('outcome ledger source 拒绝重复 key 并在结构失败时清空 validOutcomes', () => withTempDir((tempDir) => {
  const canonical = JSON.stringify(validOutcome());
  const duplicateKey = canonical.replace('"schemaVersion":1', '"schemaVersion":9,"schemaVersion":1');
  const duplicateResult = readEvolutionOutcomeLedger(writeLedger(tempDir, `${duplicateKey}\n`), options);
  assert.match(duplicateResult.failures.join('\n'), /必须使用精确紧凑 JSON/);
  assert.deepEqual(duplicateResult.validOutcomes, []);

  const malformedResult = readEvolutionOutcomeLedger(
    writeLedger(tempDir, `not-json\n${canonical}\n`), options,
  );
  assert.match(malformedResult.failures.join('\n'), /第 1 行不是合法 JSON/);
  assert.deepEqual(malformedResult.validOutcomes, []);
  assert.equal(malformedResult.invalidOutcomeCount, 2);
}));

test('outcome ledger source 保留物理 ordinal 且异常输入不抛出', () => withTempDir((tempDir) => {
  const ordinalResult = readEvolutionOutcomeLedger(writeLedger(tempDir, 'not-json\n{}\n'), options);
  assert.match(ordinalResult.failures.join('\n'), /第 2 条 outcome\.schemaVersion/);

  const arrayFields = validOutcome({
    id: ['outcome-array'], corpusVersion: ['1.0.0'], evaluatedAt: ['2026-07-15'],
  });
  const arrayResult = readEvolutionOutcomeLedger(
    writeLedger(tempDir, `${JSON.stringify(arrayFields)}\n`), options,
  );
  assert.match(arrayResult.failures.join('\n'), /id 必须是稳定的 kebab-case/);
  assert.match(arrayResult.failures.join('\n'), /corpusVersion 必须是 x\.y\.z/);

  const base = JSON.stringify(validOutcome({ verdict: 'fail', score: 10, feedback: '__DEEP__' }));
  const nested = `${'{"x":'.repeat(5000)}"end"${'}'.repeat(5000)}`;
  const deepResult = readEvolutionOutcomeLedger(
    writeLedger(tempDir, `${base.replace('"__DEEP__"', nested)}\n`), options,
  );
  assert.match(deepResult.failures.join('\n'), /结构超过支持范围|隐私扫描结构超过 64 层/);
  assert.deepEqual(deepResult.validOutcomes, []);
}));

test('outcome ledger diagnostics 不反射未知 case 或字段内容', () => withTempDir((tempDir) => {
  const marker = 'synthetic-secret-marker';
  const result = readEvolutionOutcomeLedger(writeLedger(tempDir, `${JSON.stringify(validOutcome({
    caseId: marker,
    [`/tmp/${marker}`]: true,
  }))}\n`), options);
  assert.equal(result.failures.length > 0, true);
  assert.equal(result.failures.join('\n').includes(marker), false);
}));
