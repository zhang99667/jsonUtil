import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectRegistryFailuresForRows,
  registryRow,
  withAiGovernanceTempRoot,
} from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产注册表会报告缺少复核节奏或未知复核节奏', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { reviewCadence: '' }),
      registryRow('CLAUDE.md', { reviewCadence: '偶尔复核' }),
    ], [
      'AGENTS.md',
      'CLAUDE.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 缺少复核节奏',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `CLAUDE.md` 复核节奏未纳入约定分类 `偶尔复核`',
    ]);
  });
});
