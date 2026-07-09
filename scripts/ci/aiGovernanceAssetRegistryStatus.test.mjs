import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectRegistryFailuresForRows,
  registryRow,
  withAiGovernanceTempRoot,
} from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产注册表会报告缺少状态或未知状态', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { status: '' }),
      registryRow('CLAUDE.md', { status: '临时配置' }),
    ], [
      'AGENTS.md',
      'CLAUDE.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 缺少状态',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `CLAUDE.md` 状态未纳入约定分类 `临时配置`',
    ]);
  });
});
