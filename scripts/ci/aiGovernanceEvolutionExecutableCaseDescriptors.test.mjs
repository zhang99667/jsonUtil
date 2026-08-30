import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { AI_EVOLUTION_EXECUTABLE_CASES } from './aiGovernanceEvolutionExecutableCases.mjs';
import * as runnerModule from './aiGovernanceEvolutionCaseRunner.mjs';

test('ownership v8 descriptor 锁定完整命令与 index/HEAD 交付原因', () => {
  const descriptor = AI_EVOLUTION_EXECUTABLE_CASES['rule-project-ai-asset-ownership'];
  assert.deepEqual([descriptor.caseVersion, descriptor.subjectVersion], [8, '2026-08-30.1']);
  assert.deepEqual(descriptor.argsList, [[
    '--test',
    'scripts/ci/aiGovernanceAssetDistribution.test.mjs',
    'scripts/ci/aiGovernanceAssetDistributionFiles.test.mjs',
    'scripts/ci/aiGovernanceImplementationFiles.test.mjs',
    'scripts/ci/aiGovernanceAssetDistributionReadiness.test.mjs',
    'scripts/ci/aiGovernanceAssetDistributionRedteam.test.mjs',
    'scripts/ci/aiGovernanceMaturityScorecardDistribution.test.mjs',
    'scripts/mcp/jsonutils-governance-handoff-distribution.test.mjs',
  ], [
    '--test',
    'scripts/ci/aiGovernanceCiContract.test.mjs',
    'scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs',
    'scripts/ci/aiGovernanceProjectCliArgs.test.mjs',
    'scripts/ci/aiGovernanceProjectPluginCommand.test.mjs',
    'scripts/ci/aiGovernanceProjectPluginLock.test.mjs',
    'scripts/ci/aiGovernanceProjectPluginLifecycle.test.mjs',
    'scripts/ci/aiGovernanceProjectPlugins.test.mjs',
  ], ['scripts/ci/check-ai-asset-distribution.mjs', '--workspace'], {
    args: ['scripts/ci/check-ai-asset-distribution.mjs', '--index'],
    failureClass: 'delivery-blocked',
    reasonCode: 'distribution-index-not-ready',
  }, {
    args: ['scripts/ci/check-ai-asset-distribution.mjs', '--head'],
    failureClass: 'delivery-blocked',
    reasonCode: 'distribution-head-not-ready',
  }]);
});

test('项目 plugin 聚合测试不嵌套注册 sibling test', () => {
  const source = fs.readFileSync('scripts/ci/aiGovernanceProjectPlugins.test.mjs', 'utf8');
  assert.doesNotMatch(source, /import\s+['"][^'"]+\.test\.mjs['"]/);
});

test('registry 锁定 outcome/paired writer 顺序与 validation 组件命令 display', () => {
  const outcomeDescriptor = AI_EVOLUTION_EXECUTABLE_CASES['outcome-ledger-chain-resolution'];
  assert.deepEqual([outcomeDescriptor.caseVersion, outcomeDescriptor.subjectVersion], [4, '2.2.0']);
  assert.deepEqual(outcomeDescriptor.argsList, [[
    '--test',
    'scripts/ci/aiGovernanceEvolutionOutcomeLedgerSource.test.mjs',
    'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.test.mjs',
    'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.test.mjs',
    'scripts/ci/aiGovernanceEvolutionOutcomeTransactionFailure.test.mjs',
    'scripts/ci/aiGovernanceEvolutionOutcomeRecoveryResult.test.mjs',
  ], [
    '--test',
    'scripts/ci/aiGovernanceEvolutionOutcomeChain.test.mjs',
    'scripts/ci/aiGovernanceEvolutionOutcomeLineage.test.mjs',
    'scripts/mcp/jsonutils-governance-evaluations.test.mjs',
    'scripts/mcp/jsonutils-governance-evaluation-projection.test.mjs',
    'scripts/mcp/jsonutils-governance-evaluation-outcomes.test.mjs',
    'scripts/ci/aiGovernanceCiContract.test.mjs',
    'scripts/ci/aiGovernanceScheduledWorkflowContract.test.mjs',
    'scripts/ci/aiGovernanceProjectCliArgs.test.mjs',
  ], [
    '--test',
    'scripts/ci/aiGovernanceEvolutionPairedOutcomeCandidate.test.mjs',
    'scripts/ci/aiGovernanceEvolutionPairedOutcomeWriter.test.mjs',
  ]]);
  assert.deepEqual(runnerModule.getAiGovernanceEvolutionCaseCommands({
    rootDir: process.cwd(),
    caseId: 'validation-change-matrix',
  }), [
    'node --test scripts/mcp/jsonutils-governance-validation-plan.test.mjs scripts/ci/aiGovernanceValidationChangedSet.test.mjs scripts/ci/aiGovernanceValidationCommandRegistry.test.mjs scripts/ci/aiGovernanceEvolutionCaseRunner.test.mjs scripts/ci/aiGovernanceEvolutionCaseFailure.test.mjs',
  ]);
});

test('observable trace v5 descriptor 锁定 receipt contract、source、输入与 recovery 回归', () => {
  const descriptor = AI_EVOLUTION_EXECUTABLE_CASES['observable-trace-receipt-boundary'];
  assert.deepEqual([descriptor.caseVersion, descriptor.subjectVersion], [5, '1.2.1']);
  assert.deepEqual(descriptor.argsList[0], [
    '--test',
    'scripts/ci/aiGovernanceEvolutionTrialReceiptContract.test.mjs',
  ]);
  assert.deepEqual(descriptor.argsList[1].slice(0, 4), [
    '--test',
    'scripts/ci/aiGovernanceEvolutionTrialReceiptSource.test.mjs',
    'scripts/ci/aiGovernanceEvolutionUnverifiedTraceObservationContract.test.mjs',
    'scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.test.mjs',
  ]);
});

test('project plugin Skill v9 descriptor 锁定共享 optional 字段与 lock 事务回归', () => {
  const descriptor = AI_EVOLUTION_EXECUTABLE_CASES['project-plugin-skill-semantic-contract-boundary'];
  assert.deepEqual([descriptor.caseVersion, descriptor.subjectVersion], [9, '1.8.0']);
  assert.equal(descriptor.argsList[0].includes(
    'scripts/ci/aiGovernanceSkillOptionalFieldsContract.test.mjs'), true);
  assert.equal(descriptor.argsList[0].includes(
    'scripts/ci/aiGovernanceProjectPluginSkillOptionalFields.test.mjs'), true);
  assert.equal(descriptor.argsList[0].includes(
    'scripts/ci/aiGovernanceProjectPluginLockSource.test.mjs'), true);
  assert.equal(descriptor.argsList[0].includes(
    'scripts/ci/aiGovernanceProjectPluginLockTransaction.test.mjs'), true);
});

test('registration grader descriptor 同时重放静态 contract 与执行 runner', () => {
  const descriptor = AI_EVOLUTION_EXECUTABLE_CASES['mcp-registration-canary-result-ingestion-boundary'];
  assert.deepEqual([descriptor.caseVersion, descriptor.subjectVersion], [4, '1.0.0']);
  assert.deepEqual(descriptor.argsList[0].slice(0, 7), ['--test',
    'scripts/ci/aiGovernanceRegistrationCanaryBlindResult.test.mjs',
    'scripts/ci/aiGovernanceRegistrationCanaryResult.test.mjs',
    'scripts/ci/aiGovernanceRegistrationCanaryCalibrationMutations.test.mjs',
    'scripts/ci/aiGovernanceRegistrationCanaryGraderCalibrationContract.test.mjs',
    'scripts/ci/aiGovernanceRegistrationCanaryGraderCalibration.test.mjs',
    'scripts/ci/aiGovernanceRegistrationCanaryGraderCalibrationRedteam.test.mjs']);
});

test('rule evolution descriptor 同时重放 experiment 与 learning focus 契约', () => {
  assert.deepEqual(AI_EVOLUTION_EXECUTABLE_CASES['rule-evolution-repeatable-writeback'].argsList, [[
    '--test',
    'scripts/ci/aiGovernanceEvolutionExperiments.test.mjs',
    'scripts/ci/aiGovernanceEvolutionLearningFocus.test.mjs',
    'scripts/ci/aiGovernanceEvolutionLearningReport.test.mjs',
    'scripts/ci/aiGovernanceEvolutionSuiteReport.test.mjs',
    'scripts/ci/aiGovernanceDecisionLedger.test.mjs',
    'scripts/ci/aiGovernanceDecisionLedgerTestCommandContract.test.mjs',
    'scripts/ci/aiGovernanceDecisionLedgerTestEvidence.test.mjs',
    'scripts/ci/aiGovernanceScriptReachability.test.mjs',
  ]]);
});
