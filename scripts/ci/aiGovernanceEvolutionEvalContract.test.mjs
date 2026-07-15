import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  AI_EVOLUTION_EVAL_CORPUS_MAX_BYTES,
  readEvolutionEvalCorpus,
} from './aiGovernanceEvolutionEvalContract.mjs';

const source = JSON.parse(fs.readFileSync('evals/ai-governance/cases.json', 'utf8'));
const maxDate = '2026-07-15';
const readFailure = 'cases.json: 无法读取稳定的有界普通文件';

const withTempCorpus = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-eval-contract-'));
  const file = path.join(rootDir, 'cases.json');
  try {
    fs.writeFileSync(file, JSON.stringify(source));
    return run({ file, rootDir });
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeCorpus = (file, corpus) => fs.writeFileSync(file, JSON.stringify(corpus));

const writeCorpusWithBytes = (file, byteLength) => {
  const corpus = structuredClone(source);
  const initial = JSON.stringify(corpus);
  corpus.cases[0].input.context += 'x'.repeat(byteLength - Buffer.byteLength(initial));
  const serialized = JSON.stringify(corpus);
  assert.equal(Buffer.byteLength(serialized), byteLength);
  fs.writeFileSync(file, serialized);
};

test('AI evolution corpus reader 接受当前版本化闭字段 corpus', () => withTempCorpus(({ file }) => {
  const result = readEvolutionEvalCorpus(file, { maxDate });
  assert.deepEqual(result.failures, []);
  assert.equal(result.cases.length, 38);
  assert.deepEqual(result.coverage.coverageClass, { total: 38, behavior: 18, componentBoundary: 20 });
}));

test('AI evolution corpus reader 在六层对象上拒绝未知字段且不回显 key/value', () => {
  const mutations = [
    ['root', corpus => corpus, 'cases.json: 根节点必须是闭字段对象'],
    ['case', corpus => corpus.cases[0], 'cases.json: 第 1 个 case 必须是闭字段对象'],
    ['subject', corpus => corpus.cases[0].subject, 'cases.json: 第 1 个 case.subject 必须是闭字段对象'],
    ['input', corpus => corpus.cases[0].input, 'cases.json: 第 1 个 case.input 必须是闭字段对象'],
    ['expectedOutcome', corpus => corpus.cases[0].expectedOutcome, 'cases.json: 第 1 个 case.expectedOutcome 必须是闭字段对象'],
    ['graders', corpus => corpus.cases[0].graders, 'cases.json: 第 1 个 case.graders 必须是闭字段对象'],
  ];
  for (const [layer, select, expected] of mutations) {
    withTempCorpus(({ file }) => {
      const corpus = structuredClone(source);
      select(corpus).secretField = `authorization=private-${layer}-value`;
      writeCorpus(file, corpus);
      const result = readEvolutionEvalCorpus(file, { maxDate });
      assert.deepEqual(result.failures, [expected]);
      assert.doesNotMatch(result.failures.join('\n'), /secretField|private-|authorization/);
    });
  }
});

test('AI evolution corpus reader 使用固定无值的 read、UTF-8 与 parse 诊断', () => withTempCorpus(({ file, rootDir }) => {
  const missing = path.join(rootDir, 'missing-private-marker.json');
  const missingResult = readEvolutionEvalCorpus(missing, { maxDate });
  assert.deepEqual(missingResult.failures, [readFailure]);
  assert.doesNotMatch(missingResult.failures.join('\n'), /missing-private-marker|ENOENT|rootDir/);

  fs.writeFileSync(file, Buffer.from([0xc3, 0x28]));
  assert.deepEqual(readEvolutionEvalCorpus(file, { maxDate }).failures, ['cases.json: 必须是合法 UTF-8']);

  fs.writeFileSync(file, '{"private-marker": }');
  const malformed = readEvolutionEvalCorpus(file, { maxDate });
  assert.deepEqual(malformed.failures, ['cases.json: 无法解析 JSON']);
  assert.doesNotMatch(malformed.failures.join('\n'), /private-marker|Unexpected token|valid JSON/);
}));

test('AI evolution corpus reader 只读取稳定且不超过 1 MiB 的普通文件', () => withTempCorpus(({ file }) => {
  writeCorpusWithBytes(file, AI_EVOLUTION_EVAL_CORPUS_MAX_BYTES);
  assert.deepEqual(readEvolutionEvalCorpus(file, { maxDate }).failures, []);

  writeCorpusWithBytes(file, AI_EVOLUTION_EVAL_CORPUS_MAX_BYTES + 1);
  assert.deepEqual(readEvolutionEvalCorpus(file, { maxDate }).failures, [readFailure]);

  fs.rmSync(file);
  fs.mkdirSync(file);
  assert.deepEqual(readEvolutionEvalCorpus(file, { maxDate }).failures, [readFailure]);
}));

test('AI evolution corpus reader 拒绝最终 symlink', { skip: process.platform === 'win32' }, () => withTempCorpus(({ file, rootDir }) => {
  const target = path.join(rootDir, 'target.json');
  fs.writeFileSync(target, JSON.stringify(source));
  fs.rmSync(file);
  fs.symlinkSync(target, file);
  assert.deepEqual(readEvolutionEvalCorpus(file, { maxDate }).failures, [readFailure]);
}));

test('AI evolution corpus 要求显式 coverageClass 且与组件边界 tag 一致', () => {
  for (const mutate of [
    corpus => delete corpus.cases[0].coverageClass,
    corpus => { corpus.cases[0].coverageClass = 'component-boundary'; },
  ]) withTempCorpus(({ file }) => {
    const corpus = structuredClone(source);
    mutate(corpus);
    writeCorpus(file, corpus);
    assert.match(readEvolutionEvalCorpus(file, { maxDate }).failures.join('\n'), /coverageClass/);
  });
});

test('AI evolution corpus 拒绝重复 ID、非正整数版本和 active/retired 重叠', () => {
  const mutations = [
    [corpus => { corpus.cases[1].id = corpus.cases[0].id; }, /case id 必须唯一/],
    [corpus => { delete corpus.cases[0].caseVersion; }, /caseVersion 必须是正整数/],
    [corpus => { corpus.retiredCaseIds = [corpus.cases[0].id]; }, /不能重叠/],
  ];
  for (const [mutate, expected] of mutations) withTempCorpus(({ file }) => {
    const corpus = structuredClone(source);
    mutate(corpus);
    writeCorpus(file, corpus);
    assert.match(readEvolutionEvalCorpus(file, { maxDate }).failures.join('\n'), expected);
  });
});

test('AI evolution corpus 仍拒绝已允许字段中的常见明文凭据值', () => withTempCorpus(({ file }) => {
  const corpus = structuredClone(source);
  corpus.cases[0].input.context = 'authorization=super-secret-value';
  writeCorpus(file, corpus);
  assert.match(readEvolutionEvalCorpus(file, { maxDate }).failures.join('\n'), /禁止疑似凭据值/);
}));
