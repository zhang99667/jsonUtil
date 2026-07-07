import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import {
  buildRegistryTableFixture,
  registryRow,
  withAiGovernanceTempRoot,
  writeFixtureFile,
} from './aiGovernanceTestFixtures.mjs';

test('AI 资产注册表会报告自动发现资产缺少发现规则以外的治理证据', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('docs/AI-ASSET-REGISTRY.md', { evidence: '必需文件', type: '资产账本' }),
      registryRow('docs/AI-NEW-WORKFLOW.md', { evidence: '自动发现规则、资产发现规则', type: '协作文档' }),
    ]));

    assert.deepEqual(collectAiGovernanceAssetRegistryFailures(rootDir, [
      'docs/AI-ASSET-REGISTRY.md',
    ]), [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `docs/AI-NEW-WORKFLOW.md` 缺少发现规则以外的治理证据',
    ]);
  });
});

test('AI 资产注册表接受自动发现资产的引用规则语义证据', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('docs/AI-ASSET-REGISTRY.md', { evidence: '必需文件', type: '资产账本' }),
      registryRow('docs/AI-NEW-WORKFLOW.md', { evidence: '自动发现规则、docs/AI 引用规则', type: '协作文档' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'docs/AI-ASSET-REGISTRY.md',
    ], [{ file: 'docs/AI-NEW-WORKFLOW.md' }]);

    assert.deepEqual(failures, []);
  });
});
