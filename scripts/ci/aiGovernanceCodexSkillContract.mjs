import fs from 'node:fs';
import path from 'node:path';
import { collectSkillSectionContentFailures } from './aiGovernanceCodexSkillSectionContract.mjs';
import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';

const CODEX_SKILL_FRONTMATTER_FIELDS = ['name', 'description'];
const CODEX_SKILL_REQUIRED_SECTIONS = [
  '## 必读文件',
  '## 工作流',
  '## 常用验证命令',
  '## 重点边界',
];

const collectMissingSkillFrontmatterFields = (frontmatter) => (
  CODEX_SKILL_FRONTMATTER_FIELDS
    .filter(field => !(new RegExp(`^${field}:\\s*\\S`, 'm')).test(frontmatter))
);

const extractFrontmatterName = frontmatter => frontmatter.match(/^name:\s*(\S+)/m)?.[1];
const getSkillDirectoryName = file => file.split('/').at(-2);

export const collectCodexSkillContractFailures = (rootDir, codexSkillFiles) => {
  const failures = [];

  codexSkillFiles.forEach((file) => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) {
      failures.push(`${file}: 缺少 skill frontmatter`);
    } else {
      const frontmatter = frontmatterMatch[1];
      const skillName = extractFrontmatterName(frontmatter);
      const directoryName = getSkillDirectoryName(file);

      collectMissingSkillFrontmatterFields(frontmatter)
        .forEach(field => failures.push(`${file}: frontmatter 缺少 ${field}`));
      if (skillName && skillName !== directoryName) {
        failures.push(`${file}: frontmatter name 必须等于 skill 目录名 ${directoryName}`);
      }
    }

    CODEX_SKILL_REQUIRED_SECTIONS.forEach((sectionTitle) => {
      if (getMarkdownSectionContent(content, sectionTitle) === null) failures.push(`${file}: 缺少 ${sectionTitle} 章节`);
    });

    failures.push(...collectSkillSectionContentFailures(file, content));
  });

  return failures;
};
