import fs from 'node:fs';
import path from 'node:path';

const extractInterfaceBlock = content => (
  content.match(/^interface:\s*\r?\n((?:^[ \t]+.*(?:\r?\n|$))*)/m)?.[1] ?? ''
);

const readQuotedField = (interfaceBlock, field) => (
  interfaceBlock.match(new RegExp(`^  ${field}: "([^"\\r\\n]+)"$`, 'm'))?.[1]
);

export const collectSkillUiContractFailures = (rootDir, skillFile, { required = false } = {}) => {
  const skillName = path.posix.basename(path.posix.dirname(skillFile));
  const uiFile = path.posix.join(path.posix.dirname(skillFile), 'agents/openai.yaml');
  const absoluteUiFile = path.join(rootDir, uiFile);
  if (!fs.existsSync(absoluteUiFile)) return required ? [`${uiFile}: 缺少 skill UI metadata`] : [];

  const content = fs.readFileSync(absoluteUiFile, 'utf8');
  const interfaceBlock = extractInterfaceBlock(content);
  const displayName = readQuotedField(interfaceBlock, 'display_name');
  const shortDescription = readQuotedField(interfaceBlock, 'short_description');
  const defaultPrompt = readQuotedField(interfaceBlock, 'default_prompt');
  return [
    ...(!interfaceBlock ? [`${uiFile}: 缺少 interface`] : []),
    ...(!displayName ? [`${uiFile}: display_name 必须是非空引号字符串`] : []),
    ...(!shortDescription || shortDescription.length < 25 || shortDescription.length > 64
      ? [`${uiFile}: short_description 必须是 25-64 字符的引号字符串`]
      : []),
    ...(!defaultPrompt?.includes(`$${skillName}`)
      ? [`${uiFile}: default_prompt 必须显式引用 $${skillName}`]
      : []),
  ];
};
