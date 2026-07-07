import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-ai-asset-registry-semantic-'));
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

const registryRow = (file, evidence) => (
  `| \`${file}\` | 协作文档 | 已登记 | ${evidence} |`
);

const registryTable = rows => [
  '| 资产 | 类型 | 维护契约 | 治理证据 |',
  '| --- | --- | --- | --- |',
  ...rows,
].join('\n');

test('AI 资产注册表会报告自动发现资产缺少发现规则以外的治理证据', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', registryTable([
      registryRow('docs/AI-ASSET-REGISTRY.md', '必需文件'),
      registryRow('docs/AI-NEW-WORKFLOW.md', '自动发现规则、资产发现规则'),
    ]));

    assert.deepEqual(collectAiGovernanceAssetRegistryFailures(rootDir, [
      'docs/AI-ASSET-REGISTRY.md',
    ]), [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `docs/AI-NEW-WORKFLOW.md` 缺少发现规则以外的治理证据',
    ]);
  });
});

test('AI 资产注册表接受自动发现资产的引用规则语义证据', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', registryTable([
      registryRow('docs/AI-ASSET-REGISTRY.md', '必需文件'),
      registryRow('docs/AI-NEW-WORKFLOW.md', '自动发现规则、docs/AI 引用规则'),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'docs/AI-ASSET-REGISTRY.md',
    ], [{ file: 'docs/AI-NEW-WORKFLOW.md' }]);

    assert.deepEqual(failures, []);
  });
});
