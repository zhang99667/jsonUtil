import {
  countUnicodeCodePoints,
  decodeYamlStringScalar,
  hasYamlScalarContinuation,
  readFirstYamlMappingRawValue,
} from './aiGovernanceSkillYamlAuthority.mjs';

const hasInvalidOptionalScalar = (frontmatter, field, invalidValue = () => false) => {
  const rawValue = readFirstYamlMappingRawValue(frontmatter, field);
  if (rawValue === undefined) return false;
  const scalar = decodeYamlStringScalar(rawValue);
  return hasYamlScalarContinuation(frontmatter, field) || !scalar.valid
    || !scalar.value.trim() || invalidValue(scalar.value);
};

export const collectSkillOptionalFieldFailures = (file, frontmatter) => {
  const rawCompatibility = readFirstYamlMappingRawValue(frontmatter, 'compatibility')?.trim();
  const compatibility = decodeYamlStringScalar(rawCompatibility);
  const compatibilityContinuation = hasYamlScalarContinuation(frontmatter, 'compatibility');
  return [
    ...(hasInvalidOptionalScalar(frontmatter, 'license')
      ? [`${file}: frontmatter license 必须是非空单行字符串`] : []),
    ...(compatibilityContinuation
      ? [`${file}: frontmatter compatibility 必须是单行字符串`] : []),
    ...(rawCompatibility !== undefined && !compatibilityContinuation
      && (!compatibility.valid || !compatibility.value.trim()
      || countUnicodeCodePoints(compatibility.value) > 500)
      ? [`${file}: frontmatter compatibility 必须是 1-500 字符的字符串`] : []),
    ...(hasInvalidOptionalScalar(frontmatter, 'allowed-tools', value => !/^\S+(?: +\S+)*$/u.test(value))
      ? [`${file}: frontmatter allowed-tools 必须是非空空格分隔字符串`] : []),
  ];
};
