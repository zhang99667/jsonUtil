import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import {
  buildRegistryTableFixture,
  registryRow,
  withAssetRegistryTempRoot,
  writeFixtureFile,
} from './aiGovernanceAssetRegistryTestFixtures.mjs';

test('AI 治理资产注册表会报告陈旧资产登记', () => {
  withAssetRegistryTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
      registryRow('docs/AI-REMOVED.md', { contract: '已移除但仍登记', type: '陈旧资产' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `docs/AI-REMOVED.md` 已陈旧或未纳入治理集合',
    ]);
  });
});
