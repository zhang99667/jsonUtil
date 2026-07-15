import path from 'node:path';

import { readStableUtf8File } from './aiGovernanceStableUtf8File.mjs';
import { collectSkillUiAuthorityFailures } from './aiGovernanceSkillUiAuthorityContract.mjs';
import {
  countUnicodeCodePoints,
  decodeYamlStringScalar,
  extractYamlMappingBlock,
  findDuplicateYamlMappingKeys,
  hasUnsupportedYamlMappingLine,
  hasYamlDocumentMarker,
  hasYamlMappingIndentDrift,
  hasYamlScalarContinuation,
  readFirstYamlMappingRawValue,
} from './aiGovernanceSkillYamlAuthority.mjs';

export const CODEX_SKILL_UI_MAX_BYTES = 64 * 1024;

const extractInterfaceBlock = content => (
  extractYamlMappingBlock(content, 'interface')
);

const readQuotedField = (interfaceBlock, field) => ({
  ...decodeYamlStringScalar(readFirstYamlMappingRawValue(interfaceBlock, field, 2), {
    quotedOnly: true,
  }),
  continuation: hasYamlScalarContinuation(interfaceBlock, field, 2),
});

export const collectSkillUiContractFailures = (rootDir, skillFile, { required = false } = {}) => {
  const skillName = path.posix.basename(path.posix.dirname(skillFile));
  const uiFile = path.posix.join(path.posix.dirname(skillFile), 'agents/openai.yaml');
  const source = readStableUtf8File(rootDir, uiFile, CODEX_SKILL_UI_MAX_BYTES);
  if (source.status === 'missing') return required ? [`${uiFile}: 缺少 skill UI metadata`] : [];
  if (source.status === 'too-large') return [`${uiFile}: 不能超过 ${CODEX_SKILL_UI_MAX_BYTES} bytes`];
  if (source.status === 'invalid-utf8') return [`${uiFile}: 必须是严格 UTF-8`];
  if (source.status !== 'ok') return [`${uiFile}: 必须是可读的非 symlink 普通文件`];
  const { content } = source;
  const interfaceBlock = extractInterfaceBlock(content);
  const displayName = readQuotedField(interfaceBlock, 'display_name');
  const shortDescription = readQuotedField(interfaceBlock, 'short_description');
  const defaultPrompt = readQuotedField(interfaceBlock, 'default_prompt');
  const escapedSkillName = skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exactSkillToken = new RegExp(`\\$${escapedSkillName}(?![A-Za-z0-9_-])`);
  return [
    ...(hasYamlDocumentMarker(content)
      ? [`${uiFile}: 必须是单一隐式 YAML document`] : []),
    ...findDuplicateYamlMappingKeys(content)
      .map(field => `${uiFile}: 不允许重复顶层字段 ${field}`),
    ...(hasUnsupportedYamlMappingLine(content)
      ? [`${uiFile}: 顶层 key 必须使用 plain mapping`] : []),
    ...findDuplicateYamlMappingKeys(interfaceBlock, 2)
      .map(field => `${uiFile}: interface 不允许重复字段 ${field}`),
    ...(hasUnsupportedYamlMappingLine(interfaceBlock, 2)
      || (interfaceBlock && hasYamlMappingIndentDrift(interfaceBlock, 2))
      ? [`${uiFile}: interface key 必须使用 plain mapping`] : []),
    ...(!interfaceBlock ? [`${uiFile}: 缺少 interface`] : []),
    ...(!displayName.valid || displayName.continuation || !displayName.value.trim()
      ? [`${uiFile}: display_name 必须是非空引号字符串`] : []),
    ...(!shortDescription.valid || shortDescription.continuation || !shortDescription.value.trim()
      || countUnicodeCodePoints(shortDescription.value) < 25
      || countUnicodeCodePoints(shortDescription.value) > 64
      ? [`${uiFile}: short_description 必须是 25-64 字符的引号字符串`]
      : []),
    ...(!defaultPrompt.valid || defaultPrompt.continuation || !exactSkillToken.test(defaultPrompt.value)
      ? [`${uiFile}: default_prompt 必须显式引用 $${skillName}`]
      : []),
    ...collectSkillUiAuthorityFailures(content, uiFile),
  ];
};
