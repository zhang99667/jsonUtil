import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectRegistryFailuresForRows,
  registryRow,
  withAiGovernanceTempRoot,
  writeFixtureFile,
} from './aiGovernanceTestFixtures.mjs';
import { VERSION_CHANGELOG_REFERENCES } from './aiGovernanceReferenceGroups.mjs';

test('AI 治理资产注册表接受来源匹配的治理证据', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-NEW-WORKFLOW.md', '新 AI 协作流程');
    writeFixtureFile(rootDir, '.claude/settings.local.json', '{}');
    const failures = collectRegistryFailuresForRows(rootDir, [
      registryRow('AGENTS.md', { evidence: '必需文件、入口引用规则', type: '项目入口' }),
      registryRow('rules/code-style.md', { evidence: '必需文件、版本一致性检查引用', type: '权威规则' }),
      registryRow('docs/AI-ENGINEERING-PLAYBOOK.md', { evidence: '必需文件、章节级引用检查', type: '权威流程' }),
      registryRow('docs/AI-NEW-WORKFLOW.md', { evidence: '自动发现规则、docs/AI 引用规则', type: '协作文档' }),
      registryRow('.claude/settings.local.json', { evidence: '显式豁免列表', type: '显式豁免' }),
      registryRow('scripts/ci/check-version-consistency.mjs', { evidence: '必需文件、运行时引用规则', type: '发布门禁' }),
      registryRow('scripts/ci/check-ai-governance.mjs', { evidence: '必需文件、可维护性预算', type: '治理门禁' }),
    ], [
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
