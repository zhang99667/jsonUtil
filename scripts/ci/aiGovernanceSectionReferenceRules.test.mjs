import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { collectSectionReferenceFailures } from './aiGovernanceSectionReferences.mjs';
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

test('Markdown section finder 拒绝 fenced block 伪造的演进章节与 marker', () => {
  const rules = [
    { sectionTitle: '## 按需字段协议', contains: ['route-marker'] },
    { sectionTitle: '### Unverified trace authoring', contains: ['unverified-marker'] },
    { sectionTitle: '### Paired receipt v4 authoring', contains: ['paired-marker'] },
    { sectionTitle: '## 真实章节', contains: ['visible-marker'] },
  ];
  const content = ['```markdown info', '## 按需字段协议', 'route-marker', '````',
    '~~~~ yaml', '### Unverified trace authoring', 'unverified-marker',
    '### Paired receipt v4 authoring', 'paired-marker', '~~~~~', '## 真实章节', 'visible-marker'].join('\n');
  assert.deepEqual(collectSectionReferenceFailures('demo.md', content, rules), [
    'demo.md: 缺少 ## 按需字段协议 章节，无法检查引用',
    'demo.md: 缺少 ### Unverified trace authoring 章节，无法检查引用',
    'demo.md: 缺少 ### Paired receipt v4 authoring 章节，无法检查引用',
  ]);
});

test('Markdown section finder 对未闭合或过短 fence fail closed', () => {
  const rules = [{ sectionTitle: '## 按需字段协议', contains: ['route-marker'] }];
  for (const content of ['## 按需字段协议\nroute-marker\n```js', '## 按需字段协议\nroute-marker\n~~~~ yaml\n~~~']) {
    assert.deepEqual(collectSectionReferenceFailures('demo.md', content, rules), [
      'demo.md: 缺少 ## 按需字段协议 章节，无法检查引用',
    ]);
  }
});
