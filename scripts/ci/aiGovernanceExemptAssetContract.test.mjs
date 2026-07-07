import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceExemptAssetContractFailures } from './aiGovernanceExemptAssetContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI 治理显式豁免契约接受普通本机配置', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.claude/settings.local.json', JSON.stringify({
      permissions: { allow: ['Bash(ssh:*)', 'WebFetch(domain:github.com)'] },
    }));
    writeFixtureFile(rootDir, '.claude/.gitignore', '.claude/settings.json\n.claude/tmp/\n');

    assert.deepEqual(collectAiGovernanceExemptAssetContractFailures(rootDir), []);
  });
});

test('AI 治理显式豁免契约会报告共享规则和治理命令', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.claude/settings.local.json', [
      'rules/code-style.md',
      'node scripts/ci/check-ai-governance.mjs',
    ].join('\n'));

    assert.deepEqual(collectAiGovernanceExemptAssetContractFailures(rootDir), [
      '.claude/settings.local.json: 显式豁免文件包含共享 AI 治理内容 "rules/code-style.md"，请迁移到协作资产或改成普通本机配置',
      '.claude/settings.local.json: 显式豁免文件包含共享 AI 治理内容 "node scripts/ci/check-ai-governance.mjs"，请迁移到协作资产或改成普通本机配置',
    ]);
  });
});
