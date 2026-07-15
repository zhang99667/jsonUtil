import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
  COMPLETE_CODEX_SKILL_SECTION_BODIES,
} from './aiGovernanceSkillTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = CODEX_SKILL_TEST_FILE;

test('AI 治理 skill 契约会报告缺失 frontmatter', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, [
      '# JSONUtils Maintainer',
      ...Object.entries(COMPLETE_CODEX_SKILL_SECTION_BODIES).flatMap(([section, body]) => [section, body]),
    ].join('\n'));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 缺少 skill frontmatter`,
    ]);
  });
});

test('AI 治理 skill 契约会报告缺失 frontmatter 字段', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      frontmatter: 'name: jsonutils-maintainer',
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter 缺少 description`,
      `${skillFile}: frontmatter 缺少 metadata`,
    ]);

    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      frontmatter: 'name: jsonutils-maintainer\ndescription: JSONUtils 项目维护技能。\nmetadata:\n  version: "0.1.0"',
    }));
    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter metadata 缺少 tags`,
    ]);
  });
});
