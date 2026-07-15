import { collectSkillFrontmatterContractFailures } from './aiGovernanceCodexSkillFrontmatterContract.mjs';
import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';

const CODEX_SKILL_REQUIRED_SECTIONS = [
  '## 必读文件',
  '## 工作流',
  '## 常用验证命令',
  '## 重点边界',
];

const collectMissingSectionFailures = (file, content) => (
  CODEX_SKILL_REQUIRED_SECTIONS
    .filter(sectionTitle => getMarkdownSectionContent(content, sectionTitle) === null)
    .map(sectionTitle => `${file}: 缺少 ${sectionTitle} 章节`)
);

export const collectSkillStructureContractFailures = (file, content) => {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return [
    ...(frontmatterMatch
      ? collectSkillFrontmatterContractFailures(file, frontmatterMatch[1])
      : [`${file}: 缺少 skill frontmatter`]),
    ...collectMissingSectionFailures(file, content),
  ];
};
