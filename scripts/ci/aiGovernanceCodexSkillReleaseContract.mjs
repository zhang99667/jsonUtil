import fs from 'node:fs';
import path from 'node:path';

const frontmatterField = (content, field) => (
  content.match(new RegExp(`^---[\\s\\S]*?^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim()
);

const readOptionalChangelog = (rootDir) => {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  return fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
};

const hasSkillReleaseTrace = (changelog, skillName, skillVersion) => (
  changelog
    .split(/\r?\n/)
    .some(line => line.includes(skillName) && line.includes(skillVersion))
);

export const collectSkillReleaseContractFailures = (rootDir, file, content) => {
  const changelog = readOptionalChangelog(rootDir);
  if (!changelog) return [];

  const skillName = frontmatterField(content, 'name');
  const skillVersion = frontmatterField(content, 'version');
  if (!skillName || !skillVersion) return [];

  return hasSkillReleaseTrace(changelog, skillName, skillVersion)
    ? []
    : [`${file}: frontmatter version ${skillVersion} 缺少 CHANGELOG.md 中的 ${skillName} 发布追踪`];
};
