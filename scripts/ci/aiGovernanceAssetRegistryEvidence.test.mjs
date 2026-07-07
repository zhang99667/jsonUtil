import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { collectAiGovernanceAssetRegistryFailures } from './aiGovernanceAssetRegistry.mjs';
import { VERSION_CHANGELOG_REFERENCES } from './aiGovernanceReferenceGroups.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-ai-asset-registry-evidence-'));
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

test('AI 治理资产注册表会报告治理证据未命中认可标记', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { evidence: '人工看过', type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 治理证据未命中认可标记',
    ]);
  });
});

test('AI 治理资产注册表会报告混入的未认可治理证据标记', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { evidence: '必需文件、人工看过', type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 治理证据包含未认可标记 `人工看过`',
    ]);
  });
});

test('AI 治理资产注册表会报告治理证据缺少实际来源支持', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
      registryRow('docs/AI-NEW-WORKFLOW.md', { type: '协作文档' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `docs/AI-NEW-WORKFLOW.md` 治理证据 `必需文件` 缺少实际来源支持',
    ]);
  });
});

test('AI 治理资产注册表会报告引用规则证据缺少实际规则支持', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { evidence: '必需文件、入口引用规则', type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 治理证据 `入口引用规则` 缺少实际来源支持',
    ]);
  });
});

test('AI 治理资产注册表会报告预算证据缺少实际预算支持', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { evidence: '必需文件、可维护性预算', type: '项目入口' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `AGENTS.md` 治理证据 `可维护性预算` 缺少实际来源支持',
    ]);
  });
});

test('AI 治理资产注册表会报告目标引用证据缺少实际规则支持', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('scripts/ci/check-version-consistency.mjs', { evidence: '必需文件、运行时引用规则', type: '发布门禁' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'scripts/ci/check-version-consistency.mjs',
      'docs/AI-ASSET-REGISTRY.md',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ASSET-REGISTRY.md: AI 资产登记 `scripts/ci/check-version-consistency.mjs` 治理证据 `运行时引用规则` 缺少实际来源支持',
    ]);
  });
});

test('AI 治理资产注册表接受来源匹配的治理证据', () => {
  withTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    writeFixtureFile(rootDir, '.claude/settings.local.json', '{}');
    writeFixtureFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', buildRegistryTableFixture([
      registryRow('AGENTS.md', { evidence: '必需文件、入口引用规则', type: '项目入口' }),
      registryRow('rules/code-style.md', { evidence: '必需文件、版本一致性检查引用', type: '权威规则' }),
      registryRow('docs/AI-ENGINEERING-PLAYBOOK.md', { evidence: '必需文件、章节级引用检查', type: '权威流程' }),
      registryRow('docs/AI-ASSET-REGISTRY.md', { type: '资产账本' }),
      registryRow('docs/AI-NEW-WORKFLOW.md', { evidence: '自动发现规则、docs/AI 引用规则', type: '协作文档' }),
      registryRow('.claude/settings.local.json', { evidence: '显式豁免列表', type: '显式豁免' }),
      registryRow('scripts/ci/check-version-consistency.mjs', { evidence: '必需文件、运行时引用规则', type: '发布门禁' }),
      registryRow('scripts/ci/check-ai-governance.mjs', { evidence: '必需文件、可维护性预算', type: '治理门禁' }),
    ]));

    const failures = collectAiGovernanceAssetRegistryFailures(rootDir, [
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'docs/AI-ASSET-REGISTRY.md',
      'scripts/ci/check-version-consistency.mjs',
      'scripts/ci/check-ai-governance.mjs',
    ], [
      { file: 'AGENTS.md' },
      { file: 'rules/code-style.md', contains: VERSION_CHANGELOG_REFERENCES },
      {
        file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
        contains: ['node scripts/ci/check-version-consistency.mjs'],
        sections: [{ sectionTitle: '### 4. 收尾检查', contains: [] }],
      },
      { file: 'docs/AI-NEW-WORKFLOW.md' },
    ]);

    assert.deepEqual(failures, []);
  });
});
