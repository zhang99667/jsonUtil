import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildRegistryEvidenceContext } from './aiGovernanceAssetRegistry.mjs';
import { EVIDENCE_SOURCE_CONTEXT_KEYS } from './aiGovernanceAssetRegistryEvidenceMarkers.mjs';
import {
  collectRegistryFailuresForRows,
  registryRow,
  withAiGovernanceTempRoot,
  writeFixtureFile,
} from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产注册表证据来源描述符都有 Set 上下文', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const context = buildRegistryEvidenceContext(rootDir, ['AGENTS.md'], [{ file: 'AGENTS.md' }]);

    assert.deepEqual(EVIDENCE_SOURCE_CONTEXT_KEYS.filter(key => !(context[key] instanceof Set)), []);
  });
});

test('AI 治理资产注册表会报告治理证据缺少实际来源支持', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('docs/AI-NEW-WORKFLOW.md', { type: '协作文档' }),
    ], [
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `docs/AI-NEW-WORKFLOW.md` 治理证据 `必需文件` 缺少实际来源支持',
    ]);
  });
});

test('AI 治理资产注册表会报告引用规则证据缺少实际规则支持', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { evidence: '必需文件、入口引用规则', type: '项目入口' }),
    ], [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 治理证据 `入口引用规则` 缺少实际来源支持',
    ]);
  });
});

test('AI 治理资产注册表会报告预算证据缺少实际预算支持', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { evidence: '必需文件、可维护性预算', type: '项目入口' }),
    ], [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 治理证据 `可维护性预算` 缺少实际来源支持',
    ]);
  });
});

test('AI 治理资产注册表会报告目标引用证据缺少实际规则支持', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('scripts/ci/check-version-consistency.mjs', { evidence: '必需文件、运行时引用规则', type: '发布门禁' }),
    ], [
      'scripts/ci/check-version-consistency.mjs',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `scripts/ci/check-version-consistency.mjs` 治理证据 `运行时引用规则` 缺少实际来源支持',
    ]);
  });
});
