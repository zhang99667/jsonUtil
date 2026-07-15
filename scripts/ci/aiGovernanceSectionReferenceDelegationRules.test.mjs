import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const codexSkillFiles = ['.agents/skills/jsonutils-maintainer/SKILL.md'];
const playbookFile = 'docs/AI-ENGINEERING-PLAYBOOK.md';
const delegationSectionRule = {
  sectionTitle: '### 0. 判断子 Agent 委派',
  contains: ['下一步建议：'],
};

const collectDelegationSectionFailures = (rootDir, lines) => {
  writeFixtureFile(rootDir, playbookFile, lines.join('\n'));
  return collectMissingAiGovernanceReferences(
    rootDir,
    [{
      file: playbookFile,
      contains: ['下一步建议：'],
      sections: [delegationSectionRule],
    }],
    codexSkillFiles
  );
};

test('AI 治理章节引用检查会报告子 Agent 委派关键词落错章节', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectDelegationSectionFailures(rootDir, [
      '### 0. 判断子 Agent 委派',
      '子 Agent 委派',
      '任务：',
      '结论：',
      '证据：',
      '修改文件：',
      '验证：',
      '未覆盖：',
      '### 1. 定义变更边界',
      '下一步建议：',
    ]);

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: ### 0. 判断子 Agent 委派 缺少 "下一步建议："',
    ]);
  });
});

test('AI 治理章节引用检查会忽略代码块里的伪标题', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const failures = collectDelegationSectionFailures(rootDir, [
      '### 0. 判断子 Agent 委派',
      '```bash',
      '# 代码块里的标题样文本',
      '```',
      '下一步建议：',
      '### 1. 定义变更边界',
    ]);

    assert.deepEqual(failures, []);
  });
});
