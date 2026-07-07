import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import {
  buildRegistryTableFixture,
  registryRow,
  withAiGovernanceTempRoot,
  writeFixtureFile,
} from './aiGovernanceTestFixtures.mjs';

test('AI 治理资产注册表会报告缺少表格登记的必需文件和显式豁免', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'AGENTS.md', '入口');
    writeFixtureFile(rootDir, '.claude/settings.local.json', '{}');
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', [
      '`AGENTS.md` 只在正文出现不算表格登记',
      '| 文件 | 类型 | 维护契约 |',
      '| --- | --- | --- |',
      '| `CLAUDE.md` | 项目入口 | 非目标表头不算登记 |',
      buildRegistryTableFixture([
        registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
      ]),
    ].join('\n'));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'CLAUDE.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: 缺少 AI 资产表格登记 `.claude/settings.local.json`',
      'docs/AI-ASSET-REGISTRY.md: 缺少 AI 资产表格登记 `AGENTS.md`',
      'docs/AI-ASSET-REGISTRY.md: 缺少 AI 资产表格登记 `CLAUDE.md`',
    ]);
  });
});

test('AI 治理资产注册表会报告重复登记', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { contract: '首次登记', type: '项目入口' }),
      registryRow('AGENTS.md', { contract: '重复登记', type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
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
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { type: '' }),
      registryRow('CLAUDE.md', { contract: '', type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { evidence: '', type: '资产账本' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'CLAUDE.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 缺少类型',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `CLAUDE.md` 缺少维护契约',
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `docs/AI-ASSET-REGISTRY.md` 缺少治理证据',
    ]);
  });
});
