import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectRegistryFailuresForRows,
  registryRow,
  withAiGovernanceTempRoot,
} from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产注册表会报告状态责任人复核节奏错误组合', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('.claude/settings.local.json', { status: '显式豁免', reviewCadence: '变更时复核' }),
      registryRow('.claude/.gitignore', { owner: '本机用户' }),
      registryRow('scripts/ci/check-ai-governance.mjs', {
        owner: 'AI 助手协同',
        reviewCadence: '变更时复核',
        status: '治理门禁',
      }),
    ], [
      '.claude/settings.local.json',
      '.claude/.gitignore',
      'scripts/ci/check-ai-governance.mjs',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `.claude/.gitignore` 本机用户责任人只能用于显式豁免',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `.claude/settings.local.json` 显式豁免必须由本机用户负责',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `.claude/settings.local.json` 显式豁免必须使用季度复核',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `scripts/ci/check-ai-governance.mjs` 治理门禁必须由项目维护者负责',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `scripts/ci/check-ai-governance.mjs` 治理门禁必须使用发布前复核',
    ]);
  });
});
