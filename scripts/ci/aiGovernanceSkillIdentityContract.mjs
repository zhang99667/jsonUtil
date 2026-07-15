import {
  countUnicodeCodePoints,
  decodeYamlStringScalar,
  extractYamlMappingBlock,
  findDuplicateYamlMappingKeys,
  findYamlChildIndent,
  hasUnsupportedYamlMappingLine,
  hasYamlMappingIndentDrift,
  hasYamlDocumentMarker,
  hasYamlScalarContinuation,
  readFirstYamlMappingRawValue,
} from './aiGovernanceSkillYamlAuthority.mjs';

export const readSkillIdentity = (frontmatter) => {
  const rawName = readFirstYamlMappingRawValue(frontmatter, 'name');
  const rawDescription = readFirstYamlMappingRawValue(frontmatter, 'description');
  const name = decodeYamlStringScalar(rawName);
  const description = decodeYamlStringScalar(rawDescription);
  const nameContinuation = hasYamlScalarContinuation(frontmatter, 'name');
  const descriptionContinuation = hasYamlScalarContinuation(frontmatter, 'description');
  const validName = !nameContinuation && name.valid && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name.value)
    && countUnicodeCodePoints(name.value) <= 64;
  return {
    rawName, rawDescription, name, description, nameContinuation, descriptionContinuation, validName,
  };
};

export const collectSkillFrontmatterAmbiguityFailures = (file, frontmatter) => [
  ...(hasYamlDocumentMarker(frontmatter)
    ? [`${file}: frontmatter 必须是单一隐式 YAML document`] : []),
  ...findDuplicateYamlMappingKeys(frontmatter)
    .map(field => `${file}: frontmatter 不允许重复顶层字段 ${field}`),
  ...(hasUnsupportedYamlMappingLine(frontmatter)
    ? [`${file}: frontmatter 顶层 key 必须使用 plain mapping`] : []),
];

export const collectSkillMetadataAmbiguityFailures = (file, frontmatter) => {
  const rawMetadata = readFirstYamlMappingRawValue(frontmatter, 'metadata');
  if (rawMetadata === undefined) return [];
  const metadata = extractYamlMappingBlock(frontmatter, 'metadata');
  const childIndent = findYamlChildIndent(metadata);
  const hasMappingContent = Number.isFinite(childIndent) && childIndent > 0;
  return [
    ...((rawMetadata.trim() && !rawMetadata.trim().startsWith('#')) || !hasMappingContent
      ? [`${file}: frontmatter metadata 必须使用 plain block mapping`] : []),
    ...(hasMappingContent ? findDuplicateYamlMappingKeys(metadata, childIndent)
      .map(field => `${file}: frontmatter metadata 不允许重复字段 ${field}`) : []),
    ...(hasMappingContent && (hasUnsupportedYamlMappingLine(metadata, childIndent)
      || hasYamlMappingIndentDrift(metadata, childIndent))
      ? [`${file}: frontmatter metadata key 必须使用 plain mapping`] : []),
  ];
};

export const collectSkillIdentityValueFailures = (file, identity) => {
  const directoryName = file.split('/').at(-2);
  return [
    ...(identity.nameContinuation ? [`${file}: frontmatter name 必须是单行字符串`] : []),
    ...(identity.rawName?.trim() && !identity.nameContinuation && !identity.validName
      ? [`${file}: frontmatter name 必须是 1-64 字符的小写 kebab-case`] : []),
    ...(identity.descriptionContinuation
      ? [`${file}: frontmatter description 必须是单行字符串`] : []),
    ...(identity.rawDescription?.trim() && !identity.descriptionContinuation
      && (!identity.description.valid
      || !identity.description.value.trim()
      || countUnicodeCodePoints(identity.description.value) > 1024)
      ? [`${file}: frontmatter description 必须是 1-1024 字符的字符串`] : []),
    ...(identity.validName && identity.name.value !== directoryName
      ? [`${file}: frontmatter name 必须等于 skill 目录名 ${directoryName}`] : []),
  ];
};
