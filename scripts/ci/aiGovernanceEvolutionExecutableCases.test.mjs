import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AI_EVOLUTION_CODEX_CASES } from './aiGovernanceEvolutionCodexCaseDescriptors.mjs';
import {
  AI_EVOLUTION_EXECUTABLE_CASE_IDS,
  AI_EVOLUTION_EXECUTABLE_CASES,
} from './aiGovernanceEvolutionExecutableCases.mjs';
import { mergeUniqueEvolutionCaseDescriptorGroups } from './aiGovernanceEvolutionCaseDescriptorRegistry.mjs';
import * as runnerModule from './aiGovernanceEvolutionCaseRunner.mjs';

test('descriptor group 合并保持顺序并拒绝重复 case id', () => {
  const first = { alpha: { caseVersion: 1 } };
  const second = { beta: { caseVersion: 2 } };
  const merged = mergeUniqueEvolutionCaseDescriptorGroups(first, second);

  assert.deepEqual(Object.keys(merged), ['alpha', 'beta']);
  assert.equal(merged.alpha, first.alpha);
  assert.equal(merged.beta, second.beta);
  assert.equal(Object.isFrozen(merged), true);
  assert.throws(
    () => mergeUniqueEvolutionCaseDescriptorGroups(first, { alpha: { caseVersion: 3 } }),
    /重复 case id `alpha`/
  );
});

test('executable case registry 保持 runner 公开导出、冻结 ID 与插入顺序', () => {
  assert.deepEqual(Object.keys(runnerModule), [
    'AI_EVOLUTION_EXECUTABLE_CASES',
    'AI_EVOLUTION_EXECUTABLE_CASE_IDS',
    'getAiGovernanceEvolutionCaseCommands',
    'runAiGovernanceEvolutionCases',
  ]);
  assert.equal(runnerModule.AI_EVOLUTION_EXECUTABLE_CASES, AI_EVOLUTION_EXECUTABLE_CASES);
  assert.equal(runnerModule.AI_EVOLUTION_EXECUTABLE_CASE_IDS, AI_EVOLUTION_EXECUTABLE_CASE_IDS);
  assert.equal(Object.isFrozen(AI_EVOLUTION_EXECUTABLE_CASES), true);
  assert.equal(Object.isFrozen(AI_EVOLUTION_EXECUTABLE_CASE_IDS), true);
  assert.deepEqual(AI_EVOLUTION_EXECUTABLE_CASE_IDS, [
    'rule-project-ai-asset-ownership',
    'mcp-fixed-tool-selection',
    'mcp-readonly-shell-rejection',
    'mcp-newline-version-negotiation',
    'mcp-config-credential-security',
    'outcome-ledger-chain-resolution',
    'observable-trace-receipt-boundary',
    ...Object.keys(AI_EVOLUTION_CODEX_CASES),
    'github-artifact-attestation-boundary',
    'codex-user-mcp-static-header-safety',
    'validation-change-matrix',
    'rule-evolution-repeatable-writeback',
  ]);
  assert.deepEqual(AI_EVOLUTION_EXECUTABLE_CASE_IDS, Object.keys(AI_EVOLUTION_EXECUTABLE_CASES));
});
