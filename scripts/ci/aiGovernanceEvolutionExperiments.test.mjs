import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { readEvolutionExperiments } from './aiGovernanceEvolutionExperiments.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const manifestPath = path.join(rootDir, 'evals/ai-governance/experiments.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const corpus = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'), { maxDate: '2026-07-15' });
const casesById = new Map(corpus.cases.map(item => [item.id, item]));

const withManifest = (value, run) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-experiments-'));
  const filePath = path.join(dir, 'evals/ai-governance/experiments.json');
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const fixturePath = path.join(dir, '.agents/skills/jsonutils-ai-infra-evolver/evals/evals.json');
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
    fs.copyFileSync(path.join(rootDir, '.agents/skills/jsonutils-ai-infra-evolver/evals/evals.json'), fixturePath);
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
    return run(filePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

const assertManifestFailure = (mutate, expected) => {
  const value = structuredClone(manifest);
  mutate(value);
  withManifest(value, filePath => assert.match(
    readEvolutionExperiments(filePath, { casesById, maxDate: '2026-07-15' }).failures.join('\n'),
    expected,
  ));
};

test('experiment manifest 兼容 blocked v1，并锁定 prepared v2 fixture/ingestion 边界', () => {
  const report = readEvolutionExperiments(manifestPath, { casesById, maxDate: '2026-07-15' });
  assert.deepEqual(report.failures, []);
  const experiment = report.experiments[0];
  assert.equal(experiment.design.trialPlan.length, 6);
  assert.equal(experiment.execution.status, 'blocked');
  assert.equal(experiment.metrics.pairedDelta.status, 'unavailable');
  assert.equal(experiment.design.blinding.candidateCanReadGrader, false);
  const skillExperiment = report.experiments[1];
  assert.equal(skillExperiment.contractVersion, 2);
  assert.equal(skillExperiment.fixtureRef.evalId, 1);
  assert.equal(skillExperiment.execution.status, 'prepared');
  assert.equal(skillExperiment.ingestion.status, 'unavailable');
});

test('experiment manifest 拒绝 split 泄漏、单 trial、假指标与 grader 泄漏', () => {
  for (const [mutate, expected] of [
    [value => value.experiments[0].design.splits.holdout.push('mcp-project-registration-discovery'), /train\/validation\/holdout 必须互斥/u],
    [value => { value.experiments[0].design.repetitions = 1; }, /repetitions 至少为 3/u],
    [value => { value.experiments[0].metrics.cost = { status: 'available', value: 0 }; }, /metrics\.cost 必须显式 unavailable/u],
    [value => { value.experiments[0].design.blinding.candidateCanReadGrader = true; }, /design\.blinding 必须隔离 agent\/grader 字段/u],
  ]) {
    assertManifestFailure(mutate, expected);
  }
});

test('experiment v2 拒绝 fixture、binding、ingestion 与 case 漂移', () => {
  for (const [mutate, expected] of [
    [value => { value.experiments[1].fixtureRef.sha256 = 'a'.repeat(64); }, /fixtureRef 摘要与当前 eval 不匹配/u],
    [value => { value.experiments[1].design.sharedBindings.environment.status = 'bound'; }, /sharedBindings v2 必须绑定 fixture 且保持 environment unavailable/u],
    [value => { value.experiments[1].ingestion.status = 'ready'; }, /ingestion 必须在 assignment\/environment\/protected trust 未建立时 fail closed/u],
    [value => { value.experiments[1].caseRef.caseVersion = 4; }, /caseRef 必须绑定当前 case\/subject 版本或已登记的精确历史 experiment/u],
  ]) {
    assertManifestFailure(mutate, expected);
  }
});

test('legacy v1 只按 experiment ID/caseRef/SHA-256 精确登记，不随当前 case 升版改写', () => {
  const advancedCases = new Map(casesById);
  const current = advancedCases.get('mcp-project-registration-discovery');
  advancedCases.set(current.id, { ...current, caseVersion: 2, subject: { ...current.subject, version: '1.1.0' } });
  const failures = value => withManifest(value, filePath => readEvolutionExperiments(filePath, { casesById: advancedCases, maxDate: '2026-07-15' }).failures);
  assert.deepEqual(failures(manifest), []);
  for (const [mutate, expected] of [
    [value => { value.experiments[0].caseRef.subjectVersion = '0.9.0'; }, /已登记 legacy v1 必须精确匹配 experiment ID\/caseRef\/SHA-256/u],
    [value => { value.experiments[0].originSignalId = 'other-signal'; }, /已登记 legacy v1 必须精确匹配 experiment ID\/caseRef\/SHA-256/u],
    [value => { value.experiments[0].id = 'unregistered-registration-canary'; }, /当前 case\/subject 版本或已登记的精确历史 experiment/u],
  ]) {
    const value = structuredClone(manifest);
    mutate(value);
    assert.match(failures(value).join('\n'), expected);
  }
});
