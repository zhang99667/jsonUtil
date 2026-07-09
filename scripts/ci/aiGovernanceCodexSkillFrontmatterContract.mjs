const CODEX_SKILL_FRONTMATTER_FIELDS = ['name', 'description', 'version', 'tags'];

const hasFrontmatterField = (frontmatter, field) => (
  new RegExp(`^${field}:\\s*\\S`, 'm').test(frontmatter)
);

const extractFrontmatterField = (frontmatter, field) => (
  frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim()
);

const getSkillDirectoryName = file => file.split('/').at(-2);

export const collectSkillFrontmatterContractFailures = (file, frontmatter) => {
  const skillName = extractFrontmatterField(frontmatter, 'name');
  const skillVersion = extractFrontmatterField(frontmatter, 'version');
  const skillTags = extractFrontmatterField(frontmatter, 'tags');
  const directoryName = getSkillDirectoryName(file);
  return [
    ...CODEX_SKILL_FRONTMATTER_FIELDS
      .filter(field => !hasFrontmatterField(frontmatter, field))
      .map(field => `${file}: frontmatter 缺少 ${field}`),
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
