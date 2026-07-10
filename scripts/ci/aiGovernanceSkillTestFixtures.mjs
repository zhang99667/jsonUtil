import { COMPLETE_CODEX_SKILL_SECTION_BODIES } from './aiGovernanceSkillSectionTestFixtures.mjs';

export const CODEX_SKILL_TEST_FILE = '.codex/skills/jsonutils-maintainer/SKILL.md';
export { COMPLETE_CODEX_SKILL_SECTION_BODIES } from './aiGovernanceSkillSectionTestFixtures.mjs';

export const buildCodexSkillFixtureContent = ({
  frontmatter = [
    'name: jsonutils-maintainer',
    'description: JSONUtils 项目维护技能。',
    'version: 0.1.0',
    'tags: [jsonutils, governance, maintenance]',
  ].join('\n'),
  sections = Object.keys(COMPLETE_CODEX_SKILL_SECTION_BODIES),
  sectionBodies = COMPLETE_CODEX_SKILL_SECTION_BODIES,
} = {}) => [
  '---',
  frontmatter,
  '---',
  '',
  '# JSONUtils Maintainer',
  '',
  ...sections.flatMap(section => [section, sectionBodies?.[section] ?? '', '']),
].join('\n');
