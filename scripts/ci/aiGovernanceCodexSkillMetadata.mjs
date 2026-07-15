const ALLOWED_SKILL_FRONTMATTER_FIELDS = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
export const extractSkillMetadataBlock = frontmatter => (
  frontmatter.match(/^metadata:\s*\r?\n((?:^[ \t]+.*(?:\r?\n|$))*)/m)?.[1] ?? ''
);

export const extractSkillMetadataField = (frontmatter, field) => (
  extractSkillMetadataBlock(frontmatter)
    .match(new RegExp(`^[ \\t]+${field}:\\s*(.+)$`, 'm'))?.[1]?.trim()
);

export const unquoteSkillMetadataValue = value => (
  value?.replace(/^(?:"([^"]*)"|'([^']*)')$/, '$1$2')
);

export const collectUnexpectedSkillFrontmatterFailures = (file, frontmatter) => (
  [...frontmatter.matchAll(/^([A-Za-z][\w-]*):/gm)]
    .map(([, field]) => field)
    .filter(field => !ALLOWED_SKILL_FRONTMATTER_FIELDS.has(field))
    .map(field => `${file}: frontmatter 不支持顶层字段 ${field}`)
);
