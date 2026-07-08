import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS, EVIDENCE_SOURCE_CONTEXT_KEYS, EVIDENCE_SOURCE_DESCRIPTORS } from './aiGovernanceAssetRegistryEvidenceMarkers.mjs';
import {
  collectRegistryFailuresForRows,
  registryRow,
  withAiGovernanceTempRoot,
} from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产注册表证据分组都会进入认可词表', () => {
  const groupedMarkers = EVIDENCE_SOURCE_DESCRIPTORS.map(([marker]) => marker);
  const groupedContextKeys = [...new Set(EVIDENCE_SOURCE_DESCRIPTORS.map(([, contextKey]) => contextKey))];

  assert.deepEqual(AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS, groupedMarkers);
  assert.deepEqual(EVIDENCE_SOURCE_CONTEXT_KEYS, groupedContextKeys);
});

test('AI 治理资产注册表会报告治理证据未命中认可标记', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { evidence: '人工看过', type: '项目入口' }),
    ], [
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
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { evidence: '必需文件、人工看过', type: '项目入口' }),
    ], [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 治理证据包含未认可标记 `人工看过`',
    ]);
  });
});
