import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildJsonutilsAssetInventory } from './jsonutils-governance-assets.mjs';

const withAssetRegistry = (content, run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-assets-'));
  fs.mkdirSync(path.join(rootDir, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'docs/AI-ASSET-REGISTRY.md'), content);
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('asset inventory returns bounded structured registry rows', () => {
  withAssetRegistry([
    '| 资产 | 状态 | 责任人 | 复核节奏 | 最近复核 | 类型 | 维护契约 | 治理证据 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    '| `AGENTS.md` | 工具薄入口 | 项目维护者 | 变更时复核 | 2026-07-10 | 项目入口 | 入口契约 | 必需文件、入口引用规则 |',
    '| `docs/AI-ASSET-REGISTRY.md` | 协作资产 | 项目维护者 | 变更时复核 | 2026-07-10 | 资产账本 | 账本契约 | 必需文件、资产注册表结构化校验 |',
  ].join('\n'), (rootDir) => {
    const inventory = buildJsonutilsAssetInventory({ limit: 1, cwd: rootDir });

    assert.equal(inventory.reportType, 'jsonutils-asset-inventory');
    assert.equal(inventory.ok, true);
    assert.equal(inventory.totalAssets, 2);
    assert.equal(inventory.assets.length, 1);
    assert.equal(inventory.assets[0].file, 'AGENTS.md');
    assert.equal(inventory.counts.byStatus['工具薄入口'], 1);
    assert.equal(inventory.counts.byType['资产账本'], 1);
  });
});
