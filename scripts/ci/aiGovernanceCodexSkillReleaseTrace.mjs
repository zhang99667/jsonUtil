import fs from 'node:fs';
import path from 'node:path';
import {
  extractSkillMetadataField,
  unquoteSkillMetadataValue,
} from './aiGovernanceCodexSkillMetadata.mjs';
import {
  decodeYamlStringScalar,
  readFirstYamlMappingRawValue,
} from './aiGovernanceSkillYamlAuthority.mjs';

const extractFrontmatter = content => content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? '';

export const readOptionalChangelog = (rootDir) => {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  return fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
};

export const extractSkillReleaseMetadata = (content) => {
  const frontmatter = extractFrontmatter(content);
  const name = decodeYamlStringScalar(readFirstYamlMappingRawValue(frontmatter, 'name'));
  return {
    skillName: name.valid ? name.value : undefined,
    skillVersion: unquoteSkillMetadataValue(
      extractSkillMetadataField(frontmatter, 'version'),
    ),
  };
};

export const hasSkillReleaseTrace = (changelog, skillName, skillVersion) => changelog.split(/\r?\n/).some((line) => {
  const suffix = line.slice(line.indexOf(skillName) + skillName.length);
  const version = suffix.match(/\b\d+\.\d+\.\d+\b/);
  return line.includes(skillName) && version?.[0] === skillVersion
    && !/jsonutils-[a-z0-9-]+/.test(suffix.slice(0, version.index));
});
