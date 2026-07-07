import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const codexSkillFiles = ['.codex/skills/jsonutils-maintainer/SKILL.md'];

test('AI 治理章节引用检查会报告关键词落错章节', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
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
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
        contains: ['下一步建议：'],
        sections: [{
          sectionTitle: '### 0. 判断子 Agent 委派',
          contains: ['下一步建议：'],
        }],
      }],
      codexSkillFiles
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: ### 0. 判断子 Agent 委派 缺少 "下一步建议："',
    ]);
  });
});

test('AI 治理章节引用检查会忽略代码块里的伪标题', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '### 0. 判断子 Agent 委派',
      '```bash',
      '# 代码块里的标题样文本',
      '```',
      '下一步建议：',
      '### 1. 定义变更边界',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
        contains: ['下一步建议：'],
        sections: [{
          sectionTitle: '### 0. 判断子 Agent 委派',
          contains: ['下一步建议：'],
        }],
      }],
      codexSkillFiles
    );

    assert.deepEqual(failures, []);
  });
});

test('AI 治理章节引用检查会报告 AI 安全边界落错章节', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '### 3. 编码约束',
      '本地规则优先',
      '用户手动触发',
      '可验证闭环',
      '测试',
      '脚本',
      '可复核日志',
      '### 5. 规则进化闭环',
      '敏感内容不外泄',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
        contains: ['敏感内容不外泄'],
        sections: [{
          sectionTitle: '### 3. 编码约束',
          contains: ['敏感内容不外泄'],
        }],
      }],
      codexSkillFiles
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: ### 3. 编码约束 缺少 "敏感内容不外泄"',
    ]);
  });
});
