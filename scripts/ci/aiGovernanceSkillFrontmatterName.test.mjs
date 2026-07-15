import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
} from './aiGovernanceSkillTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = CODEX_SKILL_TEST_FILE;

test('AI 治理 skill 契约会报告 frontmatter name 与目录不一致', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({
      frontmatter: [
        'name: stale-skill',
        'description: JSONUtils 项目维护技能。',
        'metadata:',
        '  version: "0.1.0"',
        '  tags: [jsonutils, governance, maintenance]',
      ].join('\n'),
    }));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: frontmatter name 必须等于 skill 目录名 jsonutils-maintainer`,
    ]);
  });
});
