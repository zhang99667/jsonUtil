import { collectUnexpectedSkillFrontmatterFailures, extractSkillMetadataBlock, extractSkillMetadataField, unquoteSkillMetadataValue } from './aiGovernanceCodexSkillMetadata.mjs';

const CODEX_SKILL_FRONTMATTER_FIELDS = ['name', 'description', 'metadata'];
const CODEX_SKILL_METADATA_FIELDS = ['version', 'tags'];

const hasFrontmatterField = (frontmatter, field) => (
  new RegExp(`^${field}:[ \\t]*\\S`, 'm').test(frontmatter)
);

const extractFrontmatterField = (frontmatter, field) => (
  frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim()
);

export const collectSkillFrontmatterContractFailures = (file, frontmatter) => {
  const skillName = extractFrontmatterField(frontmatter, 'name');
  const metadata = extractSkillMetadataBlock(frontmatter);
  const skillVersion = unquoteSkillMetadataValue(extractSkillMetadataField(frontmatter, 'version'));
  const skillTags = extractSkillMetadataField(frontmatter, 'tags');
  const directoryName = file.split('/').at(-2);
  return [
    ...CODEX_SKILL_FRONTMATTER_FIELDS
      .filter(field => field === 'metadata' ? !metadata : !hasFrontmatterField(frontmatter, field))
      .map(field => `${file}: frontmatter 缺少 ${field}`),
    ...collectUnexpectedSkillFrontmatterFailures(file, frontmatter),
    ...(metadata
      ? CODEX_SKILL_METADATA_FIELDS
        .filter(field => !extractSkillMetadataField(frontmatter, field))
        .map(field => `${file}: frontmatter metadata 缺少 ${field}`)
      : []),
    ...(skillName && skillName !== directoryName
      ? [`${file}: frontmatter name 必须等于 skill 目录名 ${directoryName}`]
      : []),
    ...(skillVersion && !/^\d+\.\d+\.\d+$/.test(skillVersion)
      ? [`${file}: frontmatter version 必须使用 x.y.z 格式`]
      : []),
    ...(skillTags && !/^\[\s*[^,\]\s][^\]]*\]$/.test(skillTags)
      ? [`${file}: frontmatter tags 必须是非空数组`]
      : []),
  ];
};
