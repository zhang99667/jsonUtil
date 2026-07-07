import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-ai-asset-registry-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeFixtureFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const registryRow = (file, fields = {}) => ({
  contract: '已登记',
  evidence: '必需文件',
  file,
  type: '测试资产',
  ...fields,
});

const buildRegistryTableFixture = rows => [
  '| 资产 | 类型 | 维护契约 | 治理证据 |',
  '| --- | --- | --- | --- |',
  ...rows.map(({ file, type, contract, evidence }) => (
    `| \`${file}\` | ${type} | ${contract} | ${evidence} |`
  )),
].join('\n');

test('AI 治理资产注册表会报告缺少表格登记的必需文件和显式豁免', () => {
  withTempRoot((rootDir) => {
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
  withTempRoot((rootDir) => {
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

test('AI 治理资产注册表会报告陈旧资产登记', () => {
  withTempRoot((rootDir) => {
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

test('AI 治理资产注册表会报告缺少类型、维护契约或治理证据', () => {
  withTempRoot((rootDir) => {
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
