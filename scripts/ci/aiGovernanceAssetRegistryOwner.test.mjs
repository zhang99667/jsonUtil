import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectRegistryFailuresForRows,
  registryRow,
  withAiGovernanceTempRoot,
} from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产注册表会报告缺少责任人或未知责任人', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { owner: '' }),
      registryRow('CLAUDE.md', { owner: '临时负责人' }),
    ], [
      'AGENTS.md',
      'CLAUDE.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 缺少责任人',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `CLAUDE.md` 责任人未纳入约定分类 `临时负责人`',
    ]);
  });
});
