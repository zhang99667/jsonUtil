import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { runAiGovernanceEvolutionCases } from './aiGovernanceEvolutionCaseRunner.mjs';
import { summarizeEvolutionCaseFailures } from './aiGovernanceEvolutionCaseFailure.mjs';

const withCorpus = (t, run, mutate = value => value) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-evolution-failure-'));
  const evalDir = path.join(rootDir, 'evals/ai-governance');
  fs.mkdirSync(evalDir, { recursive: true });
  const source = JSON.parse(fs.readFileSync('evals/ai-governance/cases.json', 'utf8'));
  fs.writeFileSync(path.join(evalDir, 'cases.json'), JSON.stringify(mutate(source)));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  return run(rootDir);
};

test('fixed runner 将普通非零断言闭字段分类为 behavior-fail', (t) => withCorpus(t, (rootDir) => {
  const report = runAiGovernanceEvolutionCases({
    rootDir,
    caseIds: ['mcp-config-credential-security'],
    runCommand: () => ({ status: 1, stdout: '', stderr: 'sensitive child output' }),
  });
  const result = report.results[0], validation = result.validations[0];
  assert.equal(validation.failureClass, 'behavior-fail');
  assert.equal(validation.reasonCode, 'fixed-command-assertion-failed');
  assert.equal(validation.diagnostic, 'fixed runner command failed: fixed-command-assertion-failed');
  assert.equal(result.failureClass, 'behavior-fail');
  assert.equal(report.counts.behaviorFailed, 1);
  assert.doesNotMatch(JSON.stringify(report), /sensitive child output/);
}));

test('component-only 断言失败不冒充 behavior-fail', (t) => withCorpus(t, (rootDir) => {
  const report = runAiGovernanceEvolutionCases({ rootDir, caseIds: ['validation-change-matrix'], runCommand: () => ({ status: 1, stdout: '', stderr: '' }) });
  assert.deepEqual([report.schemaVersion, report.results[0].failureClass], [3, 'component-fail']);
  assert.deepEqual([report.counts.componentFailed, report.counts.behaviorFailed], [1, 0]);
  const failures = ['delivery-blocked', 'component-fail', 'behavior-fail', 'infrastructure-invalid'].map(failureClass => ({ status: 'failed', failureClass, reasonCode: failureClass, diagnostic: failureClass }));
  assert.deepEqual([failures, failures.slice(0, -1), failures.slice(0, -2)].map(summarizeEvolutionCaseFailures).map(item => item.failureClass), ['infrastructure-invalid', 'behavior-fail', 'component-fail']);
}));

test('fixed runner 用 spawn 元数据区分 timeout、输出超限、启动失败与 signal', (t) => withCorpus(t, (rootDir) => {
  const fixtures = [
    [{ status: null, error: { code: 'ETIMEDOUT' } }, 'fixed-runner-timeout'],
    [{ status: null, error: { code: 'ENOBUFS' } }, 'fixed-runner-output-limit'],
    [{ status: null, error: { code: 'ENOENT' } }, 'fixed-runner-spawn-failed'],
    [{ status: null, signal: 'SIGKILL' }, 'fixed-runner-signal-exit'],
  ];
  fixtures.forEach(([commandResult, reasonCode]) => {
    const report = runAiGovernanceEvolutionCases({
      rootDir,
      caseIds: ['mcp-config-credential-security'],
      runCommand: () => commandResult,
    });
    assert.equal(report.results[0].failureClass, 'infrastructure-invalid');
    assert.equal(report.results[0].reasonCode, reasonCode);
    assert.equal(report.counts.infrastructureInvalid, 1);
    assert.equal(report.results[0].outcomeEligible, false);
  });
}));

test('fixed runner 将 index/HEAD 交付前置缺失与 workspace 行为失败分开', (t) => withCorpus(t, (rootDir) => {
  let call = 0;
  const reports = [
    { status: 0, stdout: '', stderr: '' },
    { status: 0, stdout: '', stderr: '' },
    { status: 1, stdout: JSON.stringify({ reportType: 'ai-asset-distribution', scope: 'index', counts: { failures: 3 } }), stderr: '' },
    { status: 1, stdout: JSON.stringify({ reportType: 'ai-asset-distribution', scope: 'head', counts: { failures: 2 } }), stderr: '' },
  ];
  const report = runAiGovernanceEvolutionCases({
    rootDir,
    caseIds: ['rule-project-ai-asset-ownership'],
    runCommand: () => reports[call++],
  });
  assert.equal(report.results[0].failureClass, 'delivery-blocked');
  assert.equal(report.results[0].reasonCode, 'distribution-index-not-ready');
  assert.equal(report.results[0].validations[2].failureClass, 'delivery-blocked');
  assert.equal(report.results[0].validations[2].diagnostic, 'ai-asset-distribution/index: failures=3');
  assert.equal(report.results[0].validations[3].reasonCode, 'distribution-head-not-ready');
  assert.equal(report.counts.deliveryBlocked, 1);
  assert.equal(report.counts.behaviorFailed, 0);
  assert.doesNotMatch(report.results[0].diagnostic, /^}$/);
}));

test('fixed runner 将 corpus binding 漂移标为 infrastructure-invalid 且零命令执行', (t) => withCorpus(t, (rootDir) => {
  const report = runAiGovernanceEvolutionCases({
    rootDir,
    caseIds: ['mcp-readonly-shell-rejection'],
    runCommand: () => assert.fail('binding 漂移时不应执行命令'),
  });
  assert.equal(report.results[0].failureClass, 'infrastructure-invalid');
  assert.equal(report.results[0].reasonCode, 'fixed-case-binding-mismatch');
  assert.equal(report.counts.infrastructureInvalid, 1);
}, (corpus) => {
  corpus.cases.find(item => item.id === 'mcp-readonly-shell-rejection').caseVersion += 1;
  return corpus;
}));
