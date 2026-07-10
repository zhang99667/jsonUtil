import fs from 'node:fs';
import path from 'node:path';

const extractFrontmatterField = (content, field) => (
  content.match(new RegExp(`^---[\\s\\S]*?^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim()
);

export const readOptionalChangelog = (rootDir) => {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  return fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
};

export const extractSkillReleaseMetadata = (content) => ({
  skillName: extractFrontmatterField(content, 'name'),
  skillVersion: extractFrontmatterField(content, 'version'),
});

export const hasSkillReleaseTrace = (changelog, skillName, skillVersion) => (
  changelog
    .split(/\r?\n/)
    .some(line => line.includes(skillName) && line.includes(skillVersion))
);
