import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { AI_TOOLS_SETUP_SECTION_REFERENCE_RULES } from './aiGovernancePlaybookSectionRules.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const codexSkillFiles = ['.agents/skills/jsonutils-maintainer/SKILL.md'];

test('AI 治理章节引用检查会报告工具索引必读顺序缺失决策账本', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-TOOLS-SETUP.md', [
      '## 必读顺序',
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ASSET-REGISTRY.md',
      '## 相关文档',
      'docs/AI-GOVERNANCE-DECISIONS.md',
    ].join('\n'));

    assert.deepEqual(collectMissingAiGovernanceReferences(
      rootDir,
      [{
        file: 'docs/AI-TOOLS-SETUP.md',
        contains: ['docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md'],
        sections: AI_TOOLS_SETUP_SECTION_REFERENCE_RULES,
      }],
      codexSkillFiles
    ), [
      'docs/AI-TOOLS-SETUP.md: ## 必读顺序 缺少 "docs/AI-GOVERNANCE-DECISIONS.md"',
    ]);
  });
});
