import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import {
  SKILL_RELEASE_TEST_FILE,
  writeSkillReleaseFixture,
} from './aiGovernanceSkillReleaseTestFixtures.mjs';
import { withAiGovernanceTempRoot } from './aiGovernanceTestFixtures.mjs';

test('AI 治理 skill 发布契约会报告缺少 name 与 version 同行追踪', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeSkillReleaseFixture(rootDir, 'Codex skill 发布说明缺少具体版本');

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [SKILL_RELEASE_TEST_FILE]), [
      `${SKILL_RELEASE_TEST_FILE}: frontmatter version 0.2.0 缺少 CHANGELOG.md 中的 jsonutils-maintainer 发布追踪`,
    ]);
  });
});

test('AI 治理 skill 发布契约接受 CHANGELOG 中的当前版本追踪', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeSkillReleaseFixture(rootDir, '`jsonutils-maintainer` skill 升级到 `0.2.0`');

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [SKILL_RELEASE_TEST_FILE]), []);
  });
});

test('AI 治理 skill 发布契约拒绝同行其它 skill 的版本串线', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeSkillReleaseFixture(rootDir, 'jsonutils-maintainer 0.1.0、jsonutils-ai-infra-evolver 0.2.0');

    assert.match(
      collectCodexSkillContractFailures(rootDir, [SKILL_RELEASE_TEST_FILE]).join('\n'),
      /jsonutils-maintainer 发布追踪/,
    );
  });
});
