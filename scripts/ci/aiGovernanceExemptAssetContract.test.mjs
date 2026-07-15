import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

import { collectAiGovernanceExemptAssetContractFailures } from './aiGovernanceExemptAssetContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const initGitRoot = rootDir => execFileSync('git', ['init', '--quiet', rootDir]);

test('AI 治理显式豁免契约不读取本机私有正文', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.claude/settings.local.json', 'rules/code-style.md\nnode scripts/ci/check-ai-governance.mjs\n');
    writeFixtureFile(rootDir, '.claude/.gitignore', '.claude/settings.json\n.claude/tmp/\n');
    initGitRoot(rootDir);

    assert.deepEqual(collectAiGovernanceExemptAssetContractFailures(rootDir), []);
  });
});

test('AI 治理显式豁免契约会报告共享规则和治理命令', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.claude/.gitignore', [
      'rules/code-style.md',
      'node scripts/ci/check-ai-governance.mjs',
    ].join('\n'));
    initGitRoot(rootDir);

    assert.deepEqual(collectAiGovernanceExemptAssetContractFailures(rootDir), [
      '.claude/.gitignore: 显式豁免文件包含共享 AI 治理内容 "rules/code-style.md"，请迁移到协作资产并让豁免文件只保留豁免声明',
      '.claude/.gitignore: 显式豁免文件包含共享 AI 治理内容 "node scripts/ci/check-ai-governance.mjs"，请迁移到协作资产并让豁免文件只保留豁免声明',
    ]);
  });
});

test('AI 治理显式豁免契约在非 Git 根目录 fail closed', () => {
  withAiGovernanceTempRoot((rootDir) => {
    assert.deepEqual(collectAiGovernanceExemptAssetContractFailures(rootDir), [
      'Git index 读取失败，无法证明本机私有显式豁免未被跟踪',
    ]);
  });
});

test('AI 治理显式豁免契约在 HEAD 元数据损坏时 fail closed', () => {
  withAiGovernanceTempRoot((rootDir) => {
    initGitRoot(rootDir);
    const blob = execFileSync('git', ['-C', rootDir, 'hash-object', '-w', '--stdin'], {
      encoding: 'utf8', input: 'not-a-commit\n',
    }).trim();
    writeFixtureFile(rootDir, '.git/HEAD', `${blob}\n`);
    assert.deepEqual(collectAiGovernanceExemptAssetContractFailures(rootDir), [
      'Git HEAD 读取失败，无法证明本机私有显式豁免未被跟踪',
    ]);
  });
});

test('AI 治理显式豁免契约拒绝本机私有配置进入 Git index 或 HEAD', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.claude/settings.local.json', '{}');
    initGitRoot(rootDir);
    execFileSync('git', ['-C', rootDir, 'add', '--', '.claude/settings.local.json']);
    assert.deepEqual(collectAiGovernanceExemptAssetContractFailures(rootDir), [
      '.claude/settings.local.json: 本机私有显式豁免不得进入 Git index 或 HEAD；ignore 不能取消已跟踪状态',
    ]);
    execFileSync('git', ['-C', rootDir, '-c', 'user.name=AI Governance Test',
      '-c', 'user.email=ai-governance@example.invalid', 'commit', '--quiet', '-m', 'fixture']);
    execFileSync('git', ['-C', rootDir, 'rm', '--cached', '--quiet', '--', '.claude/settings.local.json']);
    assert.deepEqual(collectAiGovernanceExemptAssetContractFailures(rootDir), [
      '.claude/settings.local.json: 本机私有显式豁免不得进入 Git index 或 HEAD；ignore 不能取消已跟踪状态',
    ]);
  });
});
