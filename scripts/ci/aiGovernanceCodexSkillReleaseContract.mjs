import {
  extractSkillReleaseMetadata,
  hasSkillReleaseTrace,
  readOptionalChangelog,
} from './aiGovernanceCodexSkillReleaseTrace.mjs';

export const collectSkillReleaseContractFailures = (rootDir, file, content) => {
  const changelog = readOptionalChangelog(rootDir);
  if (!changelog) return [];

  const { skillName, skillVersion } = extractSkillReleaseMetadata(content);
  if (!skillName || !skillVersion) return [];

  return hasSkillReleaseTrace(changelog, skillName, skillVersion)
    ? []
    : [`${file}: frontmatter version ${skillVersion} 缺少 CHANGELOG.md 中的 ${skillName} 发布追踪`];
};
