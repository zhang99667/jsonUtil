import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  AI_GOVERNANCE_DISTRIBUTION_CONTROL_FILES,
  buildAiGovernanceDistributionAssetFiles,
  discoverAiGovernanceImplementationFiles,
} from './aiGovernanceAssetDistributionFiles.mjs';
import { AI_GOVERNANCE_REQUIRED_EVOLUTION_FILES } from './aiGovernanceRequiredEvolutionFiles.mjs';
import { governanceAiMaintainabilityBudgets } from './maintainability-budget-governance-ai-rules.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('AI 分发全集覆盖协作资产、实现 namespace 与 CI/local control plane', () => {
  const requiredFiles = ['README.md', ...AI_GOVERNANCE_REQUIRED_EVOLUTION_FILES];
  const referenceRules = [{ file: 'docs/AI-ENGINEERING-PLAYBOOK.md' }];
  const files = buildAiGovernanceDistributionAssetFiles({ rootDir, requiredFiles, referenceRules });
  const fileSet = new Set(files);

  assert.equal(fileSet.size, files.length);
  assert.deepEqual(files, [...files].sort());
  assert.ok(fileSet.has('README.md'));
  assert.ok(fileSet.has('docs/AI-ENGINEERING-PLAYBOOK.md'));
  assert.ok(fileSet.has('.agents/plugins/marketplace.json'));
  assert.ok(fileSet.has('scripts/ci/aiGovernanceRules.mjs'));
  assert.ok(fileSet.has('scripts/ci/aiGovernanceCiContract.test.mjs'));
  assert.ok(fileSet.has('scripts/mcp/jsonutils-governance-server.test.mjs'));
  assert.ok(fileSet.has('scripts/ci/manage-project-plugins.mjs'));
  assert.ok(fileSet.has('scripts/ci/mcpLineDelimitedStdioClient.test.mjs'));
  assert.ok(fileSet.has('evals/ai-governance/experiments.json'));
  [
    'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.mjs',
    'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs',
    'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.test.mjs',
    'scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.test.mjs',
    'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs',
    'scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.mjs',
    'scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.test.mjs',
    'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs',
  ].forEach(file => assert.ok(fileSet.has(file), file));
  AI_GOVERNANCE_DISTRIBUTION_CONTROL_FILES.forEach(file => assert.ok(fileSet.has(file)));
  discoverAiGovernanceImplementationFiles(rootDir).forEach(file => assert.ok(fileSet.has(file)));
  governanceAiMaintainabilityBudgets.forEach(({ file }) => assert.ok(fileSet.has(file), file));
  [
    'frontend/src/services/aiService.ts',
    'scripts/ci/check-backend-api-matrix.mjs',
    'scripts/ci/maintainability-budget-app-rules.mjs',
    '.github/workflows/deploy.yml',
  ].forEach(file => assert.equal(fileSet.has(file), false, file));
});

test('AI 实现 namespace 与 eval data 对 symlink fail closed', {
  skip: process.platform === 'win32',
}, () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-distribution-files-'));
  try {
    ['scripts/ci', 'scripts/mcp', 'evals/ai-governance'].forEach(directory => (
      fs.mkdirSync(path.join(tempRoot, directory), { recursive: true })
    ));
    fs.writeFileSync(path.join(tempRoot, 'target.mjs'), 'export {};\n');
    fs.symlinkSync('../../target.mjs', path.join(tempRoot, 'scripts/ci/aiGovernanceLinked.mjs'));
    assert.throws(() => discoverAiGovernanceImplementationFiles(tempRoot), /必须是普通文件/);

    fs.unlinkSync(path.join(tempRoot, 'scripts/ci/aiGovernanceLinked.mjs'));
    fs.symlinkSync('../../target.mjs', path.join(tempRoot, 'evals/ai-governance/linked.json'));
    assert.throws(() => discoverAiGovernanceImplementationFiles(tempRoot), /AI data asset/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
