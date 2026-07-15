import {
  decodeYamlStringScalar,
  extractYamlMappingBlock,
  findDuplicateYamlMappingKeys,
  hasUnsupportedYamlMappingLine,
  hasYamlMappingIndentDrift,
  hasYamlScalarContinuation,
  listYamlMappingEntries,
  readFirstYamlMappingRawValue,
} from './aiGovernanceSkillYamlAuthority.mjs';

const BOOLEAN_PATTERN = /^(?:true|false)(?:[ \t]+#.*)?$/;
const TOOL_ITEM_PATTERN = /^ {4}-[ \t]+([A-Za-z][\w.-]*):(?:[ \t]+(.*))?$/;
const TOOL_FIELD_PATTERN = /^ {6}([A-Za-z][\w.-]*):(?:[ \t]+(.*))?$/;
const TOOL_FIELDS = ['type', 'value', 'description', 'transport', 'url'];
const MAX_TOOL_DEPENDENCIES = 32;

const collectPolicyFailures = (content, uiFile) => {
  const rawPolicy = readFirstYamlMappingRawValue(content, 'policy');
  if (rawPolicy === undefined) return [];
  const policy = extractYamlMappingBlock(content, 'policy');
  if (!policy) {
    return [`${uiFile}: policy 必须是 block mapping`];
  }
  if (listYamlMappingEntries(policy, 2).length === 0) return [
    `${uiFile}: policy ${hasUnsupportedYamlMappingLine(policy, 2)
      ? 'key 必须使用 plain mapping' : '必须是 block mapping'}`,
  ];
  const invocation = readFirstYamlMappingRawValue(policy, 'allow_implicit_invocation', 2);
  return [
    ...findDuplicateYamlMappingKeys(policy, 2)
      .map(field => `${uiFile}: policy 不允许重复字段 ${field}`),
    ...(hasUnsupportedYamlMappingLine(policy, 2) || hasYamlMappingIndentDrift(policy, 2)
      ? [`${uiFile}: policy key 必须使用 plain mapping`] : []),
    ...(invocation !== undefined && (!BOOLEAN_PATTERN.test(invocation.trim())
      || hasYamlScalarContinuation(policy, 'allow_implicit_invocation', 2))
      ? [`${uiFile}: policy.allow_implicit_invocation 必须是 true 或 false`] : []),
  ];
};

const parseToolItems = (tools) => {
  const items = [];
  let current = null;
  for (const line of tools.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const item = TOOL_ITEM_PATTERN.exec(line);
    if (item) {
      current = [{ key: item[1], rawValue: item[2] ?? '' }];
      items.push(current);
      continue;
    }
    const field = TOOL_FIELD_PATTERN.exec(line);
    if (!field || !current) return null;
    current.push({ key: field[1], rawValue: field[2] ?? '' });
  }
  return items;
};

const collectToolItemFailures = (entries, index, uiFile) => {
  const label = `${uiFile}: dependencies.tools[${index}]`;
  const seen = new Set();
  const duplicates = new Set();
  const values = new Map();
  let unknown = false;
  for (const entry of entries) {
    if (!TOOL_FIELDS.includes(entry.key)) unknown = true;
    if (seen.has(entry.key)) duplicates.add(entry.key);
    else {
      seen.add(entry.key);
      values.set(entry.key, decodeYamlStringScalar(entry.rawValue, { quotedOnly: true }));
    }
  }
  const type = values.get('type');
  const value = values.get('value');
  return [
    ...(duplicates.size ? [`${label} 不允许重复字段`] : []),
    ...(unknown ? [`${label} 只允许 type/value/description/transport/url`] : []),
    ...(!type?.valid || type.value !== 'mcp' ? [`${label} type 必须精确等于 mcp`] : []),
    ...(!value?.valid || !value.value.trim() ? [`${label} value 必须是非空引号字符串`] : []),
    ...['description', 'transport', 'url'].flatMap((field) => {
      const decoded = values.get(field);
      return decoded && (!decoded.valid || !decoded.value.trim())
        ? [`${label} ${field} 必须是非空引号字符串`] : [];
    }),
  ];
};

const collectDependenciesFailures = (content, uiFile) => {
  const rawDependencies = readFirstYamlMappingRawValue(content, 'dependencies');
  if (rawDependencies === undefined) return [];
  const dependencies = extractYamlMappingBlock(content, 'dependencies');
  if (!dependencies || listYamlMappingEntries(dependencies, 2).length === 0) {
    return [`${uiFile}: dependencies 必须是 block mapping`];
  }
  const duplicates = findDuplicateYamlMappingKeys(dependencies, 2);
  const rawTools = readFirstYamlMappingRawValue(dependencies, 'tools', 2);
  const tools = extractYamlMappingBlock(dependencies, 'tools', 2);
  const items = rawTools === undefined || rawTools.trim() || !tools ? null : parseToolItems(tools);
  return [
    ...duplicates.map(field => `${uiFile}: dependencies 不允许重复字段 ${field}`),
    ...(hasUnsupportedYamlMappingLine(dependencies, 2)
      ? [`${uiFile}: dependencies key 必须使用 plain mapping`] : []),
    ...(!items || items.length === 0 || items.length > MAX_TOOL_DEPENDENCIES
      ? [`${uiFile}: dependencies.tools 必须是非空 block sequence`] : []),
    ...(!items || items.length > MAX_TOOL_DEPENDENCIES ? []
      : items.flatMap((entries, index) => collectToolItemFailures(entries, index, uiFile))),
  ];
};

export const collectSkillUiAuthorityFailures = (content, uiFile) => [
  ...collectPolicyFailures(content, uiFile),
  ...collectDependenciesFailures(content, uiFile),
];
