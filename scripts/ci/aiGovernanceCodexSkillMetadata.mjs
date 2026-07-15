import {
  decodeYamlStringScalar,
  extractYamlMappingBlock,
  listYamlMappingEntries,
  readFirstYamlMappingRawValue,
} from './aiGovernanceSkillYamlAuthority.mjs';

const ALLOWED_SKILL_FRONTMATTER_FIELDS = new Set([
  'name', 'description', 'license', 'compatibility', 'allowed-tools', 'metadata',
]);
export const extractSkillMetadataBlock = frontmatter => (
  extractYamlMappingBlock(frontmatter, 'metadata')
);

export const extractSkillMetadataFieldFromBlock = (metadata, field) => (
  readFirstYamlMappingRawValue(metadata, field, 2)?.trim()
);

export const extractSkillMetadataField = (frontmatter, field) => (
  extractSkillMetadataFieldFromBlock(extractSkillMetadataBlock(frontmatter), field)
);

export const unquoteSkillMetadataValue = value => (
  decodeYamlStringScalar(value).valid ? decodeYamlStringScalar(value).value : value
);

export const collectUnexpectedSkillFrontmatterFailures = (file, frontmatter) => (
  listYamlMappingEntries(frontmatter)
    .map(({ key }) => key)
    .filter(field => !ALLOWED_SKILL_FRONTMATTER_FIELDS.has(field))
    .map(field => `${file}: frontmatter 不支持顶层字段 ${field}`)
);
