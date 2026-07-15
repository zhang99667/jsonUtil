import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI evolution Playbook 必须在 Skill 评测章节保留隔离与可审计契约', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'docs/AI-EVOLUTION-PLAYBOOK.md', [
      '## Skill 评测',
      '同一任务',
      '隔离可写工作区',
      'execution transcript',
      '`unavailable`',
      '## 必跑命令',
      '前后状态快照',
    ].join('\n'));

    const failures = collectMissingAiGovernanceReferences(rootDir, [{
      file: 'docs/AI-EVOLUTION-PLAYBOOK.md',
      contains: ['scripts/ci/run-ai-evolution-cases.mjs'],
      sections: [{
        sectionTitle: '## Skill 评测',
        contains: ['前后状态快照'],
      }],
    }], ['.agents/skills/jsonutils-maintainer/SKILL.md']);

    assert.deepEqual(failures, [
      'docs/AI-EVOLUTION-PLAYBOOK.md: 缺少 "scripts/ci/run-ai-evolution-cases.mjs"',
      'docs/AI-EVOLUTION-PLAYBOOK.md: ## Skill 评测 缺少 "前后状态快照"',
    ]);
  });
});
