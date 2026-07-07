import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';

const CODEX_SKILL_FRONTMATTER_FIELDS = ['name', 'description'];
const CODEX_SKILL_REQUIRED_SECTIONS = [
  '## 必读文件',
  '## 工作流',
  '## 常用验证命令',
  '## 重点边界',
];

const collectMissingSkillFrontmatterFields = frontmatter => (
  CODEX_SKILL_FRONTMATTER_FIELDS
    .filter(field => !(new RegExp(`^${field}:\\s*\\S`, 'm')).test(frontmatter))
);

const extractFrontmatterName = frontmatter => frontmatter.match(/^name:\s*(\S+)/m)?.[1];
const getSkillDirectoryName = file => file.split('/').at(-2);

const collectFrontmatterFailures = (file, frontmatter) => {
  const skillName = extractFrontmatterName(frontmatter);
  const directoryName = getSkillDirectoryName(file);
  return [
    ...collectMissingSkillFrontmatterFields(frontmatter)
      .map(field => `${file}: frontmatter 缺少 ${field}`),
    ...(skillName && skillName !== directoryName
      ? [`${file}: frontmatter name 必须等于 skill 目录名 ${directoryName}`]
      : []),
  ];
};

const collectMissingSectionFailures = (file, content) => (
  CODEX_SKILL_REQUIRED_SECTIONS
    .filter(sectionTitle => getMarkdownSectionContent(content, sectionTitle) === null)
    .map(sectionTitle => `${file}: 缺少 ${sectionTitle} 章节`)
);

export const collectSkillStructureContractFailures = (file, content) => {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return [
    ...(frontmatterMatch
      ? collectFrontmatterFailures(file, frontmatterMatch[1])
      : [`${file}: 缺少 skill frontmatter`]),
    ...collectMissingSectionFailures(file, content),
  ];
};
