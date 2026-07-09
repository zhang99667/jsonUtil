import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
} from './aiGovernanceSkillTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = CODEX_SKILL_TEST_FILE;

const writeSkillAndChangelog = (rootDir, changelogLine) => {
  writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
    frontmatter: [
      'name: jsonutils-maintainer',
      'description: JSONUtils 项目维护技能。',
      'version: 0.2.0',
      'tags: [jsonutils, governance, maintenance]',
    ].join('\n'),
  }));
  writeFixtureFile(rootDir, 'CHANGELOG.md', `# 更新日志\n## v1.8.999 (2026-07-09)\n- ${changelogLine}\n`);
};

test('AI 治理 skill 发布契约会报告缺少 name 与 version 同行追踪', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeSkillAndChangelog(rootDir, 'Codex skill 发布说明缺少具体版本');

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter version 0.2.0 缺少 CHANGELOG.md 中的 jsonutils-maintainer 发布追踪`,
    ]);
  });
});

test('AI 治理 skill 发布契约接受 CHANGELOG 中的当前版本追踪', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeSkillAndChangelog(rootDir, '`jsonutils-maintainer` skill 升级到 `0.2.0`');

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), []);
  });
});
