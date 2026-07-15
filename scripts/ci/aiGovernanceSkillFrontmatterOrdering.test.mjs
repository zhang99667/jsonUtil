import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { buildCodexSkillFixtureContent, CODEX_SKILL_TEST_FILE, withCodexSkillTempRoot } from './aiGovernanceSkillTestFixtures.mjs';
import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = CODEX_SKILL_TEST_FILE;

test('AI 治理 skill 契约保持 frontmatter 失败顺序并接受额外 string metadata', () => {
  withCodexSkillTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      frontmatter: [
        'name: stale-skill',
        'description: JSONUtils 项目维护技能。',
        'metadata:',
        '  tags: ""',
        '  categories: [governance]',
      ].join('\n'),
    }));
    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter metadata 缺少 version`,
      `${skillFile}: frontmatter name 必须等于 skill 目录名 jsonutils-maintainer`,
      `${skillFile}: frontmatter metadata 必须是 string→string map`,
      `${skillFile}: frontmatter metadata.tags 必须是非空逗号分隔字符串`,
    ]);

    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      frontmatter: [
        'name: jsonutils-maintainer',
        'description: JSONUtils 项目维护技能。',
        'metadata:',
        '  version: "0.1.0"',
        '  tags: "jsonutils,governance"',
        '  categories: "governance"',
      ].join('\n'),
    }));
    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), []);
  });
});
