import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const defaultCorpus = JSON.parse(fs.readFileSync(path.join(projectRoot, 'evals/ai-governance/cases.json'), 'utf8'));

const validOutcome = overrides => ({
  schemaVersion: 1,
  id: 'outcome-fixture-one',
  caseId: 'rule-read-before-write',
  corpusVersion: '1.0.0',
  caseVersion: 1,
  subjectVersion: '2026-07-10',
  evaluatedAt: '2026-07-10',
  verdict: 'pass',
  score: 100,
  provenance: {
    method: 'deterministic',
    source: 'local',
    runner: 'node-test',
    revision: 'fixture-revision',
    trials: 1,
  },
  writeback: {
    files: [],
    validationResults: [{
      command: 'node --test scripts/ci/example.test.mjs',
      status: 'passed',
      evidence: 'fixture validation passed',
      checkedAt: '2026-07-10',
    }],
  },
  ...overrides,
});

const reportForOutcomes = (outcomes, corpus = defaultCorpus) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-evolution-outcome-'));
  try {
    const evalDir = path.join(rootDir, 'evals/ai-governance');
    fs.mkdirSync(evalDir, { recursive: true });
    fs.writeFileSync(path.join(evalDir, 'cases.json'), `${JSON.stringify(corpus, null, 2)}\n`);
    fs.writeFileSync(path.join(evalDir, 'outcomes.jsonl'), outcomes.map(JSON.stringify).join('\n'));
    fs.writeFileSync(path.join(evalDir, 'trial-receipts.jsonl'), '');
    return buildAiGovernanceEvolutionEvalReport({ rootDir, maxDate: '2026-07-15' });
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('outcome ledger 保留 v1 writeback 但不再计入行为分数', () => {
  const report = reportForOutcomes([validOutcome({
    writeback: {
      files: ['rules/code-style.md'],
      validationResults: [{
        command: 'node --test scripts/ci/example.test.mjs',
        status: 'passed',
        evidence: '测试进程退出码为 0',
        checkedAt: '2026-07-10',
      }],
    },
  })]);

  assert.equal(report.ok, true);
  assert.equal(report.counts.pass, 0);
  assert.equal(report.counts.totalOutcomes, 1);
  assert.equal(report.counts.activeLatestOutcomes, 0);
  assert.equal(report.counts.legacyOutcomes, 1);
  assert.equal(report.counts.coveredCases, 0);
});

test('outcome ledger 拒绝重复 outcome id 与未知 case', () => {
  const duplicate = validOutcome({ caseId: 'missing-case' });
  const report = reportForOutcomes([duplicate, duplicate]);

  assert.equal(report.ok, false);
  assert.match(report.failures.join('\n'), /引用了未知 case/);
  assert.equal(report.failures.join('\n').includes('missing-case'), false);
  assert.match(report.failures.join('\n'), /outcome id 必须唯一/);
});

test('outcome ledger 拒绝未来日期', () => {
  const report = reportForOutcomes([validOutcome({ evaluatedAt: '9999-01-01' })]);
  assert.match(report.failures.join('\n'), /不能晚于当前日期/);
});

test('outcome ledger 拒绝敏感字段名', () => {
  const report = reportForOutcomes([validOutcome({ rawPrompt: '虚构且已脱敏的内容' })]);
  assert.match(report.failures.join('\n'), /禁止敏感字段名/);
});

test('outcome ledger 拒绝敏感值与未声明字段', () => {
  const report = reportForOutcomes([validOutcome({
    provenance: {
      method: 'deterministic', source: 'local', runner: 'Bearer abcdefghijklmnop', revision: 'fixture', trials: 1,
      extra: 'not-allowed',
    },
  })]);
  assert.match(report.failures.join('\n'), /禁止疑似凭据值/);
  assert.match(report.failures.join('\n'), /provenance 必须是闭字段对象/);
  assert.equal(report.failures.join('\n').includes('extra'), false);
});

test('outcome ledger 要求 fail 或 partial 提供 feedback', () => {
  const report = reportForOutcomes([validOutcome({ verdict: 'fail', score: 20 })]);
  assert.match(report.failures.join('\n'), /必须提供 feedback/);
});

test('outcome ledger 要求 writeback 文件关联实际验证结果', () => {
  const report = reportForOutcomes([validOutcome({
    writeback: { files: ['rules/code-style.md'], validationResults: [] },
  })]);
  assert.match(report.failures.join('\n'), /必须包含实际 validationResults/);
});

test('outcome ledger 拒绝无验证证据或验证失败的 pass', () => {
  const noWriteback = validOutcome({ id: 'outcome-no-writeback' });
  delete noWriteback.writeback;
  const failedValidation = validOutcome({
    id: 'outcome-failed-validation',
    writeback: {
      files: [],
      validationResults: [{
        command: 'node --test fixture', status: 'failed', evidence: 'exit 1', checkedAt: '2026-07-10',
      }],
    },
  });
  const lowScore = validOutcome({ id: 'outcome-low-score', score: 0 });
  const report = reportForOutcomes([noWriteback, failedValidation, lowScore]);
  assert.match(report.failures.join('\n'), /必须提供实际 validationResults/);
  assert.match(report.failures.join('\n'), /所有 validationResults 必须 passed/);
  assert.match(report.failures.join('\n'), /score 不能低于 60/);
});

test('outcome ledger 将 v1 component-only deterministic pass 降为 legacy', () => {
  for (const runner of ['ai-evolution-case-runner', 'ai-evolution-case-runner+validation-matrix', 'another-runner']) {
    const report = reportForOutcomes([validOutcome({
      caseId: 'mcp-fixed-tool-selection',
      subjectVersion: '0.3.0',
      provenance: {
        method: 'deterministic', source: 'local', runner, revision: 'fixture', trials: 1,
      },
    })]);

    assert.equal(report.ok, true);
    assert.equal(report.counts.legacyOutcomes, 1);
    assert.equal(report.counts.coveredCases, 0);
  }
});
