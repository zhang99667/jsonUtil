import fs from 'node:fs';
import path from 'node:path';
import {
  extractSkillMetadataField,
  unquoteSkillMetadataValue,
} from './aiGovernanceCodexSkillMetadata.mjs';

const extractFrontmatterField = (content, field) => (
  content.match(new RegExp(`^---[\\s\\S]*?^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim()
);

export const readOptionalChangelog = (rootDir) => {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  return fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
};

export const extractSkillReleaseMetadata = (content) => ({
  skillName: extractFrontmatterField(content, 'name'),
  skillVersion: unquoteSkillMetadataValue(
    extractSkillMetadataField(content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '', 'version'),
  ),
});

export const hasSkillReleaseTrace = (changelog, skillName, skillVersion) => changelog.split(/\r?\n/).some((line) => {
  const suffix = line.slice(line.indexOf(skillName) + skillName.length);
  const version = suffix.match(/\b\d+\.\d+\.\d+\b/);
  return line.includes(skillName) && version?.[0] === skillVersion
    && !/jsonutils-[a-z0-9-]+/.test(suffix.slice(0, version.index));
});
