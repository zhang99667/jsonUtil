import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const codexSkillFiles = ['.agents/skills/jsonutils-maintainer/SKILL.md'];

test('AI 治理章节引用检查会报告决策账本不在 Playbook 必读顺序', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-ENGINEERING-PLAYBOOK.md', [
      '## 必读顺序',
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ASSET-REGISTRY.md',
      '## 标准执行闭环',
      'docs/AI-GOVERNANCE-DECISIONS.md',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
        contains: ['docs/AI-GOVERNANCE-DECISIONS.md'],
        sections: [{
          sectionTitle: '## 必读顺序',
          contains: ['docs/AI-GOVERNANCE-DECISIONS.md'],
        }],
      }],
      codexSkillFiles
    );

    assert.deepEqual(failures, [
      'docs/AI-ENGINEERING-PLAYBOOK.md: ## 必读顺序 缺少 "docs/AI-GOVERNANCE-DECISIONS.md"',
    ]);
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
