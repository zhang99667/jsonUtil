import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import { buildAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistryFailures.mjs';
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
      '| 资产 | 类型 | 维护契约 | 治理证据 |',
      '| --- | --- | --- | --- |',
      '| `AGENTS.md` | 项目入口 | 旧四列表头不算登记 | 必需文件 |',
      '| 资产 | 状态 | 类型 | 维护契约 | 治理证据 |',
      '| --- | --- | --- | --- | --- |',
      '| `CLAUDE.md` | 工具薄入口 | 项目入口 | 旧五列表头不算登记 | 必需文件 |',
      '| 资产 | 状态 | 责任人 | 类型 | 维护契约 | 治理证据 |',
      '| --- | --- | --- | --- | --- | --- |',
      '| `rules/code-style.md` | 权威流程 | 项目维护者 | 权威规则 | 旧六列表头不算登记 | 必需文件 |',
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

test('AI 治理资产注册表会报告证据来源上下文缺失', () => {
  const failures = buildAiGovernanceAssetRegistryFailures({
    duplicateFiles: [],
    evidenceContext: { expectedRegistryFiles: ['AGENTS.md'] },
    registryRows: new Map([['AGENTS.md', { contract: '契约', evidence: '必需文件', type: '项目入口' }]]),
  });

  assert.equal(failures.includes('docs/AI-ASSET-REGISTRY.md: AI 资产注册表证据来源集合缺少 `requiredFiles`'), true);
});
