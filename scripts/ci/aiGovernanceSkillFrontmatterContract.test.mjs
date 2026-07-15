import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { buildCodexSkillFixtureContent, CODEX_SKILL_TEST_FILE, withCodexSkillTempRoot } from './aiGovernanceSkillTestFixtures.mjs';
import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = CODEX_SKILL_TEST_FILE;

test('AI 治理 skill 契约会报告 frontmatter 元数据格式错误', () => {
  withCodexSkillTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      frontmatter: [
        'name: jsonutils-maintainer',
        'description: JSONUtils 项目维护技能。',
        'metadata:',
        '  version: ""',
        '  tags: ""',
        '  categories: [governance]',
        'version: 0.1.0',
        'tags: "legacy"',
      ].join('\n'),
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter 不支持顶层字段 version`,
      `${skillFile}: frontmatter 不支持顶层字段 tags`,
      `${skillFile}: frontmatter version 必须使用 x.y.z 格式`,
      `${skillFile}: frontmatter metadata 必须是 string→string map`,
      `${skillFile}: frontmatter metadata.tags 必须是非空逗号分隔字符串`,
    ]);
  });
});
