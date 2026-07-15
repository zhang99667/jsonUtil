import {
  extractSkillMetadataFieldFromBlock,
  unquoteSkillMetadataValue,
} from './aiGovernanceCodexSkillMetadata.mjs';
import {
  decodeYamlStringScalar,
} from './aiGovernanceSkillYamlAuthority.mjs';

const CODEX_SKILL_METADATA_FIELDS = ['version', 'tags'];
const hasStringMetadataMap = metadata => metadata.split(/\r?\n/)
  .filter(line => line.trim() && !/^\s*#/.test(line))
  .every((line) => {
    const rawValue = line.match(/^ {2}[A-Za-z][\w.-]*:[ \t]*(.*)$/)?.[1];
    const scalar = decodeYamlStringScalar(rawValue, { quotedOnly: true });
    return scalar.valid;
  });

export const collectSkillMetadataContractFailures = (file, metadata) => {
  if (!metadata) return { structureFailures: [], missingFieldFailures: [], valueFailures: [] };
  const rawSkillVersion = extractSkillMetadataFieldFromBlock(metadata, 'version');
  const rawSkillTags = extractSkillMetadataFieldFromBlock(metadata, 'tags');
  const skillVersion = unquoteSkillMetadataValue(rawSkillVersion);
  const skillTags = unquoteSkillMetadataValue(rawSkillTags);
  return {
    structureFailures: [],
    missingFieldFailures: CODEX_SKILL_METADATA_FIELDS
      .filter(field => !extractSkillMetadataFieldFromBlock(metadata, field))
      .map(field => `${file}: frontmatter metadata 缺少 ${field}`),
    valueFailures: [
      ...(rawSkillVersion && !/^\d+\.\d+\.\d+$/.test(skillVersion)
        ? [`${file}: frontmatter version 必须使用 x.y.z 格式`] : []),
      ...(!hasStringMetadataMap(metadata)
        ? [`${file}: frontmatter metadata 必须是 string→string map`] : []),
      ...(rawSkillTags && (!decodeYamlStringScalar(rawSkillTags, { quotedOnly: true }).valid
        || !/^[a-z0-9]+(?:-[a-z0-9]+)*(?:,[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(skillTags))
        ? [`${file}: frontmatter metadata.tags 必须是非空逗号分隔字符串`] : []),
    ],
  };
};
