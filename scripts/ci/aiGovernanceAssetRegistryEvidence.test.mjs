import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import { AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS, EVIDENCE_SOURCE_CONTEXT_KEYS, EVIDENCE_SOURCE_DESCRIPTORS } from './aiGovernanceAssetRegistryEvidenceMarkers.mjs';
import {
  buildRegistryTableFixture,
  registryRow,
  withAiGovernanceTempRoot,
  writeFixtureFile,
} from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产注册表证据分组都会进入认可词表', () => {
  const groupedMarkers = EVIDENCE_SOURCE_DESCRIPTORS.map(([marker]) => marker);
  const groupedContextKeys = [...new Set(EVIDENCE_SOURCE_DESCRIPTORS.map(([, contextKey]) => contextKey))];

  assert.deepEqual(AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS, groupedMarkers);
  assert.deepEqual(EVIDENCE_SOURCE_CONTEXT_KEYS, groupedContextKeys);
});

test('AI 治理资产注册表会报告治理证据未命中认可标记', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { evidence: '人工看过', type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 治理证据未命中认可标记',
    ]);
  });
});

test('AI 治理资产注册表会报告混入的未认可治理证据标记', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { evidence: '必需文件、人工看过', type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 治理证据包含未认可标记 `人工看过`',
    ]);
  });
});
