import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectRegistryFailuresForRows,
  registryRow,
  withAiGovernanceTempRoot,
} from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产注册表会报告重复登记', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { contract: '首次登记', type: '项目入口' }),
      registryRow('AGENTS.md', { contract: '重复登记', type: '项目入口' }),
    ], [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 重复',
    ]);
  });
});

test('AI 治理资产注册表会报告缺少类型、维护契约或治理证据', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { type: '' }),
      registryRow('CLAUDE.md', { contract: '', type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { evidence: '', type: '资产账本' }),
    ], [
      'AGENTS.md',
      'CLAUDE.md',
      'docs/AI-ASSET-REGISTRY.md',
    ], [], { includeRegistryAssetRow: false });

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 缺少类型',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `CLAUDE.md` 缺少维护契约',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `docs/AI-ASSET-REGISTRY.md` 缺少治理证据',
    ]);
  });
});
