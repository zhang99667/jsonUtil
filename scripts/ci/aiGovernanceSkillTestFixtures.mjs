export const CODEX_SKILL_TEST_FILE = '.codex/skills/jsonutils-maintainer/SKILL.md';

export const COMPLETE_CODEX_SKILL_SECTION_BODIES = {
  '## 必读文件': [
    'AGENTS.md',
    'rules/code-style.md',
    'docs/AI-ENGINEERING-PLAYBOOK.md',
    'docs/AI-ASSET-REGISTRY.md',
    'docs/AI-GOVERNANCE-DECISIONS.md',
  ].join('\n'),
  '## 工作流': [
    'git status --short --branch',
    '子 Agent 委派',
    'frontend/package.json',
    'CHANGELOG.md',
    '规则/skill 回写',
    '决策记录',
    '回写追踪',
    '锁定测试',
  ].join('\n'),
  '## 常用验证命令': [
    'node scripts/ci/check-version-consistency.mjs',
    'node scripts/ci/check-ai-governance.mjs',
    'node scripts/ci/check-maintainability-budgets.mjs',
    'npm run build',
  ].join('\n'),
  '## 重点边界': [
    'dispatchChunkLoadRecoveryEvent',
    'Content-Type',
    '本地规则优先',
    'node scripts/ci/check-ai-governance.mjs',
  ].join('\n'),
};

export const buildCodexSkillFixtureContent = ({
  frontmatter = [
    'name: jsonutils-maintainer',
    'description: JSONUtils 项目维护技能。',
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
