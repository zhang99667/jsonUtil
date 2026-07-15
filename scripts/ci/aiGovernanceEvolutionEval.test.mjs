import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { buildAiGovernanceEvolutionEvalReport } from './aiGovernanceEvolutionEvalReport.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const defaultCorpus = JSON.parse(fs.readFileSync(path.join(projectRoot, 'evals/ai-governance/cases.json'), 'utf8'));
const componentBoundaryCaseIds = [
  'codex-user-mcp-static-header-safety',
  'codex-exec-jsonl-adapter-boundary',
  'codex-fixed-mcp-trial-proof-boundary',
  'codex-external-controller-topology-boundary',
  'codex-external-controller-runtime-probe-boundary', 'codex-project-agent-profile-boundary', 'codex-project-session-start-hook-boundary',
  'mcp-registration-canary-sealed-snapshot-boundary',
  'mcp-registration-canary-launch-packet-boundary',
  'mcp-registration-canary-result-ingestion-boundary', 'mcp-registration-canary-grade-checkpoint-request-boundary',
  'mcp-registration-canary-anchor-receipt-boundary', 'mcp-registration-canary-disclosure-authorization-boundary',
  'github-artifact-attestation-boundary',
  'codex-external-controller-seatbelt-sentinel-boundary',
  'codex-external-controller-attested-runtime-preflight-boundary',
];
const withTempEvalRoot = (run, corpus = defaultCorpus) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-evolution-eval-'));
  try {
    const evalDir = path.join(rootDir, 'evals/ai-governance');
    fs.mkdirSync(evalDir, { recursive: true });
    fs.writeFileSync(path.join(evalDir, 'cases.json'), `${JSON.stringify(corpus, null, 2)}\n`);
    fs.writeFileSync(path.join(evalDir, 'outcomes.jsonl'), '');
    fs.writeFileSync(path.join(evalDir, 'trial-receipts.jsonl'), '');
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('AI 治理进化 eval 接受版本化 corpus 和空 outcome ledger', () => {
  withTempEvalRoot((rootDir) => {
    const tracePolicyRegistry = { failures: [], policiesByCaseId: new Map([['mcp-fixed-tool-selection', {}]]) };
    const report = buildAiGovernanceEvolutionEvalReport({ rootDir, maxDate: '2026-07-13', tracePolicyRegistry });

    assert.equal(report.ok, true);
    assert.equal(report.schemaVersion, 1);
    assert.equal(report.reportType, 'ai-governance-evolution-evals');
    assert.deepEqual(Object.fromEntries(['cases', 'behaviorCases', 'componentBoundaryCases'].map(key => [key, report.counts[key]])), {
      cases: 34, behaviorCases: 18, componentBoundaryCases: 16,
    });
    assert.equal(report.counts.outcomes, 0);
    assert.equal(report.counts.totalOutcomes, 0);
    assert.equal(report.counts.staleOutcomes, 0);
    assert.equal(report.coverage.corpus.skillTrigger.nearNegative, 1);
    assert.equal(report.coverage.corpus.delegation.negative, 1);
    assert.equal(report.coverage.corpus.mcp.protocol, 1); assert.equal(report.coverage.corpus.hook, 2);
    assert.deepEqual(report.coverage.corpus.coverageClass, { total: 34, behavior: 18, componentBoundary: 16 });
    assert.equal(report.coverage.outcomes.totalCases, 18);
    assert.equal(report.coverage.outcomes.uncoveredCaseIds.length, 18);
    assert.deepEqual(report.coverage.outcomes.excluded, {
      coverageClass: 'component-boundary', totalCases: 16, caseIds: componentBoundaryCaseIds,
    });
    assert.deepEqual(defaultCorpus.cases.filter(item => item.coverageClass === 'component-boundary').map(item => item.id), componentBoundaryCaseIds);
    assert.equal(defaultCorpus.cases.find(item => item.id === 'mcp-fixed-tool-selection').coverageClass, 'behavior');
    assert.equal(report.nextFocus.id, 'record-first-outcomes');
    assert.deepEqual(report.nextFocus.caseIds, ['mcp-fixed-tool-selection', 'rule-read-before-write', 'rule-preserve-dirty-worktree']);
  });
});

test('AI 治理进化 eval 要求显式 coverageClass 且与组件边界 tag 一致', () => {
  for (const mutate of [
    corpus => delete corpus.cases[0].coverageClass,
    corpus => { corpus.cases[0].coverageClass = 'component-boundary'; },
  ]) {
    const corpus = structuredClone(defaultCorpus);
    mutate(corpus);
    withTempEvalRoot((rootDir) => assert.match(
      buildAiGovernanceEvolutionEvalReport({ rootDir, maxDate: '2026-07-13' }).failures.join('\n'),
      /coverageClass/
    ), corpus);
  }
});

test('AI 治理进化 eval 拒绝重复 case id', () => {
  const corpus = structuredClone(defaultCorpus);
  corpus.cases[1].id = corpus.cases[0].id;

  withTempEvalRoot((rootDir) => {
    const report = buildAiGovernanceEvolutionEvalReport({ rootDir, maxDate: '2026-07-13' });
    assert.equal(report.ok, false);
    assert.match(report.failures.join('\n'), /case id 必须唯一/);
  }, corpus);
});

test('AI 治理进化 eval 要求每个 case 有正整数 caseVersion', () => {
  const corpus = structuredClone(defaultCorpus);
  delete corpus.cases[0].caseVersion;

  withTempEvalRoot((rootDir) => {
    const report = buildAiGovernanceEvolutionEvalReport({ rootDir, maxDate: '2026-07-13' });
    assert.equal(report.ok, false);
    assert.match(report.failures.join('\n'), /caseVersion 必须是正整数/);
  }, corpus);
});

test('AI 治理进化 eval 拒绝常见明文凭据值', () => {
  const corpus = structuredClone(defaultCorpus);
  corpus.cases[0].input.context = 'authorization=super-secret-value';
  withTempEvalRoot((rootDir) => {
    const report = buildAiGovernanceEvolutionEvalReport({ rootDir, maxDate: '2026-07-13' });
    assert.equal(report.ok, false);
    assert.match(report.failures.join('\n'), /禁止疑似凭据值/);
  }, corpus);
});

test('AI 治理进化 eval 拒绝 active 与 retired case 重叠', () => {
  const corpus = structuredClone(defaultCorpus);
  corpus.retiredCaseIds = [corpus.cases[0].id];
  withTempEvalRoot((rootDir) => {
    const report = buildAiGovernanceEvolutionEvalReport({ rootDir, maxDate: '2026-07-13' });
    assert.match(report.failures.join('\n'), /不能重叠/);
  }, corpus);
});

test('AI 治理进化 eval CLI 同时支持默认人读与 JSON 输出', () => {
  const humanOutput = execFileSync(process.execPath, ['scripts/ci/check-ai-evolution-evals.mjs'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  const jsonOutput = execFileSync(process.execPath, ['scripts/ci/check-ai-evolution-evals.mjs', '--json'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  const report = JSON.parse(jsonOutput);
  assert.match(humanOutput, new RegExp(`校验通过：${report.counts.cases} cases，${report.counts.outcomes} outcomes`));
  assert.match(humanOutput, new RegExp(`账本链：${report.ledgerChain.status}`));
  assert.match(humanOutput, new RegExp(report.nextFocus.id));
  assert.match(humanOutput, new RegExp(report.blockedFocus.id));
  assert.equal(report.ok, true);
});
