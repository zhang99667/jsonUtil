import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
} from './aiGovernanceSkillTestFixtures.mjs';
import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

export const SKILL_RELEASE_TEST_FILE = CODEX_SKILL_TEST_FILE;

export const writeSkillReleaseFixture = (rootDir, changelogLine) => {
  writeFixtureFile(rootDir, SKILL_RELEASE_TEST_FILE, buildCodexSkillFixtureContent({
    frontmatter: [
      'name: jsonutils-maintainer',
      'description: JSONUtils 项目维护技能。',
      'metadata:',
      '  version: "0.2.0"',
      '  tags: [jsonutils, governance, maintenance]',
    ].join('\n'),
  }));
  writeFixtureFile(rootDir, 'CHANGELOG.md', `# 更新日志\n## v1.8.999 (2026-07-09)\n- ${changelogLine}\n`);
};
