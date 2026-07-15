import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  buildAiGovernanceDistributionAssetFiles,
  discoverAiGovernanceImplementationFiles as discoverImplementationFilesFromDistribution,
} from './aiGovernanceAssetDistributionFiles.mjs';
import { discoverAiGovernanceAssetFiles } from './aiGovernanceDiscoveredAssets.mjs';
import { discoverAiGovernanceImplementationFiles } from './aiGovernanceImplementationFiles.mjs';
import { AI_GOVERNANCE_REQUIRED_EVOLUTION_FILES } from './aiGovernanceRequiredEvolutionFiles.mjs';
import { governanceAiMaintainabilityBudgets } from './maintainability-budget-governance-ai-rules.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('AI 分发全集覆盖协作资产、实现 namespace 与 CI/local control plane', () => {
  const requiredFiles = ['README.md', ...AI_GOVERNANCE_REQUIRED_EVOLUTION_FILES];
  const referenceRules = [
    { file: 'README.md' },
    { file: 'docs/AI-ENGINEERING-PLAYBOOK.md' },
  ];
  const files = buildAiGovernanceDistributionAssetFiles({ rootDir, requiredFiles, referenceRules });
  const fileSet = new Set(files);

  assert.equal(fileSet.size, files.length);
  assert.deepEqual(files, [...files].sort());
  assert.equal(discoverImplementationFilesFromDistribution, discoverAiGovernanceImplementationFiles);
  assert.ok(fileSet.has('README.md'));
  assert.ok(fileSet.has('docs/AI-ENGINEERING-PLAYBOOK.md'));
  assert.ok(fileSet.has('.agents/plugins/marketplace.json'));
  requiredFiles.forEach(file => assert.ok(fileSet.has(file), file));
  discoverAiGovernanceAssetFiles(rootDir).forEach(file => assert.ok(fileSet.has(file), file));
  discoverAiGovernanceImplementationFiles(rootDir).forEach(file => assert.ok(fileSet.has(file)));
  governanceAiMaintainabilityBudgets.forEach(({ file }) => assert.ok(fileSet.has(file), file));
});
