import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';

const CODEX_SKILL_SECTION_CONTENT_REQUIREMENTS = [
  {
    sectionTitle: '## 必读文件',
    contains: ['AGENTS.md', 'rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md'],
  },
  {
    sectionTitle: '## 工作流',
    contains: ['git status --short --branch', '子 Agent 委派', 'frontend/package.json', 'CHANGELOG.md', '规则/skill 回写', '决策记录', '回写追踪', '锁定测试'],
  },
  {
    sectionTitle: '## 常用验证命令',
    contains: ['node scripts/ci/check-version-consistency.mjs', 'node scripts/ci/check-ai-governance.mjs', 'node scripts/ci/check-maintainability-budgets.mjs', 'npm run build'],
  },
  {
    sectionTitle: '## 重点边界',
    contains: ['dispatchChunkLoadRecoveryEvent', 'Content-Type', '本地规则优先', 'node scripts/ci/check-ai-governance.mjs'],
  },
];

export const collectSkillSectionContentFailures = (file, content) => (
  CODEX_SKILL_SECTION_CONTENT_REQUIREMENTS.flatMap(({ sectionTitle, contains }) => {
    const sectionContent = getMarkdownSectionContent(content, sectionTitle);
    if (sectionContent === null) return [];

    return contains
      .filter(expectedText => !sectionContent.includes(expectedText))
      .map(expectedText => `${file}: ${sectionTitle} 缺少 "${expectedText}"`);
  })
);
