import fs from 'node:fs';
import path from 'node:path';

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
      collectMissingSkillFrontmatterFields(frontmatterMatch[1])
        .forEach(field => failures.push(`${file}: frontmatter 缺少 ${field}`));
    }

    CODEX_SKILL_REQUIRED_SECTIONS.forEach((sectionTitle) => {
      if (!content.includes(sectionTitle)) failures.push(`${file}: 缺少 ${sectionTitle} 章节`);
    });
  });

  return failures;
};
