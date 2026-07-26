import type { JsonValue } from '../types';
import type { SchemeDecodeResult } from './schemeTypes';
import {
  detectSchemeType,
  isActionableSchemeUrl,
} from './schemeUtils';
import { appendJsonPathKey } from './jsonPathSegments';
import { isJsonObject } from './jsonValueGuards';
import {
  getPrimaryCommandFieldPriority,
  isCommandInsightField,
  isExtInsightField,
  isResourceInsightField,
} from './schemeMetadataFieldRules';
import {
  getSchemeCommandSchemaFromSource,
  getSchemeCommandSourceInfo,
  getSchemeMetadataSourceObjectChild,
  parseSchemeMetadataSourceShape,
  type SchemeMetadataSourceShape,
} from './schemeMetadataSourceShape';
import {
  parseSchemeMetadataContext,
  type SchemeMetadataContext,
} from './schemeMetadataContext';
import { wrapNestedCmdHandlerParams } from './schemeMetadataCmdHandlerWrapper';
import { getUrlResourceSchemaFromUrl } from './schemeUrlResourceSchema';
import { isRecord as isPlainObject } from './storage';
import {
  formatDecodedPathCopyValue,
  stringifyUnknownValue,
} from './transformValuePreview';

export { getUrlResourceSchemaFromUrl } from './schemeUrlResourceSchema';
export { getSchemeCommandSchemaFromUrl } from './schemeMetadataSourceShape';

export interface Base64MetaEntry {
  key: string;
  displayValue: string;
}

export interface Base64MetaInfo {
  prefix: string;
  suffix: string;
  suffixDecodePrefix: string;
  suffixLength: number;
  suffixDecodedCount: number;
  suffixDecodedEntries: Base64MetaEntry[];
}

export interface SchemeInsightFields {
  commandFields: string[];
  commandFieldRows: SchemeInsightFieldRow[];
  commandFieldCount: number;
  resourceFields: string[];
  resourceFieldRows: SchemeInsightFieldRow[];
  resourceFieldCount: number;
  extFields: string[];
  extFieldCount: number;
  base64SuffixFields: string[];
  base64SuffixFieldCount: number;
}

export interface SchemeInsightFieldRow {
  key: string;
  path: string;
  preview: string;
  copyText?: string;
  value?: unknown;
  sourceValue?: unknown;
}

export interface SchemeCommandSummaryInfo extends SchemeInsightFields {
  commandSchema?: string;
  paramCount: number;
  paramKeys: string[];
  commandSchemaCount: number;
  topCommandSchemas: SchemeCommandSchemaSummary[];
}

export interface SchemeCommandSchemaSummary {
  schema: string;
  count: number;
  paths: string[];
  hasMorePaths: boolean;
}

export interface CmdHandlerCompatibleResult {
  result: {
    cmdSchema?: string;
    cmdParams: unknown;
    source?: string;
  };
}

export interface CmdHandlerCommandSchemaRow {
  schema: string;
  path: string;
  source: string;
}

interface SchemeInsightCollectOptions {
  includeCommandFieldRows?: boolean;
  source?: string;
}

interface SchemeMetadataTraversalTask {
  value: unknown;
  sourceShape: SchemeMetadataSourceShape | null;
  sourceValue?: SchemeMetadataSourceShape;
  path: string;
  key?: string;
}

export interface SchemeCommandSummaryContextOptions {
  includeCommandFieldRows?: boolean;
}

interface PrimaryCommandCandidate {
  decodedValue: JsonValue;
  source: string;
  commandSchema?: string;
  priority: number;
  depth: number;
  order: number;
}

interface PrimaryCommandCollectTask {
  decodedValue: JsonValue;
  rawSource: unknown;
  depth: number;
  key?: string;
  candidateDepth?: number;
}

const DEFAULT_DISPLAY_LIMIT = 64;
const COMMAND_SCHEMA_SUMMARY_LIMIT = 6;
const COMMAND_SCHEMA_SUMMARY_PATH_LIMIT = 3;

const dedupe = (values: string[]): string[] => (
  Array.from(new Set(values)).filter(Boolean)
);

const isResourceInsightValue = (value: unknown): boolean => {
  if (Boolean(value) && typeof value === 'object') return true;
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  return Boolean(trimmed) && detectSchemeType(trimmed) === 'url';
};

const formatInsightFieldPreview = (value: unknown, maxLength = DEFAULT_DISPLAY_LIMIT): string => {
  if (isPlainObject(value)) {
    if (typeof value.cmdSchema === 'string') {
      return value.cmdSchema.length > maxLength
        ? `${value.cmdSchema.slice(0, maxLength)}...`
        : value.cmdSchema;
    }

    const keys = Object.keys(value);
    if (keys.length === 0) return '对象: 空';

    const visibleKeys = keys.slice(0, 4).join(', ');
    return keys.length > 4
      ? `对象: ${visibleKeys} ... +${keys.length - 4}`
      : `对象: ${visibleKeys}`;
  }

  if (Array.isArray(value)) return `数组 ${value.length} 项`;

  const text = typeof value === 'string'
    ? value
    : value === null
      ? 'null'
      : String(value);

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const createInsightFieldRow = (
  key: string,
  path: string,
  value: unknown,
  sourceValue?: SchemeMetadataSourceShape
): SchemeInsightFieldRow => ({
  key,
  path,
  preview: formatInsightFieldPreview(value),
  value,
  ...(sourceValue !== undefined ? { sourceValue } : {}),
});

export const getSchemeInsightFieldCopyText = (
  row: SchemeInsightFieldRow
): string => {
  if (row.copyText !== undefined) return row.copyText;

  const value = Object.hasOwn(row, 'value')
    ? row.value
    : row.preview;
  return `${row.path} = ${formatDecodedPathCopyValue(value)}`;
};

const collectSchemeInsightFieldsFromSourceShape = (
  value: unknown,
  sourceShape: SchemeMetadataSourceShape | null,
  options: SchemeCommandSummaryContextOptions = {},
): SchemeInsightFields => {
  const commandFields: string[] = [];
  const commandFieldRows: SchemeInsightFieldRow[] = [];
  const resourceFields: string[] = [];
  const resourceFieldRows: SchemeInsightFieldRow[] = [];
  const extFields: string[] = [];
  const base64SuffixFields: string[] = [];
  const tasks: SchemeMetadataTraversalTask[] = [{ value, sourceShape, path: '$' }];

  while (tasks.length > 0) {
    const task = tasks.pop();
    if (!task) break;

    const isObjectItem = Boolean(task.value) && typeof task.value === 'object';
    if (task.key !== undefined) {
      if (isResourceInsightField(task.key) && isResourceInsightValue(task.value)) {
        resourceFields.push(task.key);
        if (options.includeCommandFieldRows !== false) {
          resourceFieldRows.push(createInsightFieldRow(
            task.key,
            task.path,
            task.value,
            task.sourceValue
          ));
        }
      } else if (isObjectItem && isCommandInsightField(task.key)) {
        commandFields.push(task.key);
        if (options.includeCommandFieldRows !== false) {
          commandFieldRows.push(createInsightFieldRow(task.key, task.path, task.value));
        }
      }

      if (isPlainObject(task.value)) {
        if (isExtInsightField(task.key)) extFields.push(task.key);
        if (task.key === '_base64_suffix_decoded') {
          base64SuffixFields.push(...Object.keys(task.value));
        }
      }
    }

    if (Array.isArray(task.value)) {
      for (let index = task.value.length - 1; index >= 0; index -= 1) {
        if (!(index in task.value)) continue;
        tasks.push({
          value: task.value[index],
          sourceShape: Array.isArray(task.sourceShape) ? task.sourceShape[index] ?? null : null,
          path: `${task.path}[${index}]`,
        });
      }
      continue;
    }

    if (!isPlainObject(task.value)) continue;
    const entries = Object.entries(task.value);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const [key, item] = entries[index];
      const childSourceValue = isPlainObject(task.sourceShape) ? task.sourceShape[key] : undefined;
      tasks.push({
        value: item,
        sourceShape: childSourceValue ?? null,
        sourceValue: childSourceValue,
        path: appendJsonPathKey(task.path, key),
        key,
      });
    }
  }

  return {
    commandFields: dedupe(commandFields),
    commandFieldRows,
    commandFieldCount: commandFields.length,
    resourceFields: dedupe(resourceFields),
    resourceFieldRows,
    resourceFieldCount: resourceFields.length,
    extFields: dedupe(extFields),
    extFieldCount: extFields.length,
    base64SuffixFields: dedupe(base64SuffixFields),
    base64SuffixFieldCount: base64SuffixFields.length,
  };
};

export const collectSchemeInsightFields = (
  value: unknown,
  options: SchemeInsightCollectOptions = {},
): SchemeInsightFields => (
  collectSchemeInsightFieldsFromSourceShape(
    value,
    parseSchemeMetadataSourceShape(options.source?.trim()),
    options,
  )
);

export const formatSchemeInsightItems = (
  title: string,
  items: string[],
  limit = 4
): string | undefined => {
  const uniqueItems = dedupe(items);
  if (uniqueItems.length === 0) return undefined;

  const visibleItems = uniqueItems.slice(0, limit).join(', ');
  return uniqueItems.length > limit
    ? `${title}: ${visibleItems} +${uniqueItems.length - limit}`
    : `${title}: ${visibleItems}`;
};

const getRawSourceChild = (source: unknown, key: string, index?: number): unknown => {
  if (Array.isArray(source)) {
    return index === undefined ? undefined : source[index];
  }
  return isPlainObject(source) ? source[key] : undefined;
};

const findPrimaryCommandCandidate = (
  cmdParams: JsonValue,
  rawSource: unknown,
): PrimaryCommandCandidate | null => {
  if (!rawSource) return null;

  const candidates: PrimaryCommandCandidate[] = [];
  const tasks: PrimaryCommandCollectTask[] = [{ decodedValue: cmdParams, rawSource, depth: 0 }];
  let order = 0;

  while (tasks.length > 0) {
    const task = tasks.pop()!;
    const commandSourceInfo = task.key !== undefined
      && isJsonObject(task.decodedValue)
      && isCommandInsightField(task.key)
      && typeof task.rawSource === 'string'
      ? getSchemeCommandSourceInfo(task.rawSource)
      : null;
    if (commandSourceInfo && task.key !== undefined && task.candidateDepth !== undefined) {
      candidates.push({
        decodedValue: task.decodedValue,
        source: commandSourceInfo.source,
        ...(commandSourceInfo.cmdSchema ? { commandSchema: commandSourceInfo.cmdSchema } : {}),
        priority: getPrimaryCommandFieldPriority(task.key),
        depth: task.candidateDepth,
        order,
      });
      order += 1;
    }

    if (Array.isArray(task.decodedValue)) {
      for (let index = task.decodedValue.length - 1; index >= 0; index -= 1) {
        if (!Object.hasOwn(task.decodedValue, index)) continue;
        tasks.push({
          decodedValue: task.decodedValue[index],
          rawSource: getRawSourceChild(task.rawSource, String(index), index),
          depth: task.depth + 1,
        });
      }
      continue;
    }
    if (!isJsonObject(task.decodedValue)) continue;

    const entries = Object.entries(task.decodedValue);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const [key, item] = entries[index];
      tasks.push({
        decodedValue: item,
        rawSource: getRawSourceChild(task.rawSource, key),
        depth: task.depth + 1,
        key,
        candidateDepth: task.depth,
      });
    }
  }
  if (candidates.length === 0) return null;

  return candidates.sort((left, right) => (
    right.priority - left.priority ||
    left.depth - right.depth ||
    left.order - right.order
  ))[0];
};

const collectCmdHandlerCommandSchemaRowsFromSourceShape = (
  decodedValue: unknown,
  sourceShape: SchemeMetadataSourceShape | null,
): CmdHandlerCommandSchemaRow[] => {
  const rows: CmdHandlerCommandSchemaRow[] = [];
  const tasks: SchemeMetadataTraversalTask[] = [{ value: decodedValue, sourceShape, path: '$' }];

  while (tasks.length > 0) {
    const task = tasks.pop()!;
    const commandSourceInfo = task.key !== undefined
      && isCommandInsightField(task.key)
      && isPlainObject(task.value)
      ? getSchemeCommandSourceInfo(task.sourceValue)
      : null;
    if (commandSourceInfo?.cmdSchema) {
      rows.push({
        schema: commandSourceInfo.cmdSchema,
        path: task.path,
        source: commandSourceInfo.source,
      });
    }

    if (Array.isArray(task.value)) {
      const sourceItems = Array.isArray(task.sourceShape) ? task.sourceShape : [];
      for (let index = task.value.length - 1; index >= 0; index -= 1) {
        if (!Object.hasOwn(task.value, index)) continue;
        tasks.push({
          value: task.value[index],
          sourceShape: sourceItems[index] ?? null,
          path: `${task.path}[${index}]`,
        });
      }
      continue;
    }
    if (!isPlainObject(task.value)) continue;

    const entries = Object.entries(task.value);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const [key, item] = entries[index];
      const childSource = getSchemeMetadataSourceObjectChild(task.sourceShape, key);
      tasks.push({
        value: item,
        sourceShape: typeof childSource === 'string'
          ? parseSchemeMetadataSourceShape(childSource)
          : childSource ?? null,
        sourceValue: childSource,
        path: appendJsonPathKey(task.path, key),
        key,
      });
    }
  }
  return rows;
};

export const collectCmdHandlerCommandSchemaRows = (
  decodedValue: unknown,
  source?: string,
): CmdHandlerCommandSchemaRow[] => (
  collectCmdHandlerCommandSchemaRowsFromSourceShape(
    decodedValue,
    parseSchemeMetadataSourceShape(source?.trim()),
  )
);

const buildCommandSchemaSummaries = (
  rows: CmdHandlerCommandSchemaRow[],
  pinnedSchema?: string
): SchemeCommandSchemaSummary[] => {
  const groups = new Map<string, { count: number; paths: string[]; pathSet: Set<string> }>();

  rows.forEach(row => {
    const group = groups.get(row.schema);
    if (group) {
      group.count += 1;
      if (!group.pathSet.has(row.path)) {
        group.pathSet.add(row.path);
        if (group.paths.length < COMMAND_SCHEMA_SUMMARY_PATH_LIMIT) {
          group.paths.push(row.path);
        }
      }
      return;
    }

    groups.set(row.schema, {
      count: 1,
      paths: [row.path],
      pathSet: new Set([row.path]),
    });
  });

  const summaries = Array.from(groups.entries())
    .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
    .map(([schema, group]) => ({
      schema,
      count: group.count,
      paths: group.paths,
      hasMorePaths: group.pathSet.size > group.paths.length,
    }));

  if (!pinnedSchema) {
    return summaries.slice(0, COMMAND_SCHEMA_SUMMARY_LIMIT);
  }

  const pinnedSummary = summaries.find(item => item.schema === pinnedSchema);
  if (!pinnedSummary) {
    return summaries.slice(0, COMMAND_SCHEMA_SUMMARY_LIMIT);
  }

  return [
    pinnedSummary,
    ...summaries.filter(item => item.schema !== pinnedSchema),
  ].slice(0, COMMAND_SCHEMA_SUMMARY_LIMIT);
};

const getCommandSchemaFromInfo = (
  schemeInfo: SchemeDecodeResult['schemeInfo'],
  source?: string
): string | undefined => {
  if (!schemeInfo?.protocol || schemeInfo.protocol === '无协议') return undefined;
  if (
    (schemeInfo.protocol === 'http:' || schemeInfo.protocol === 'https:' || schemeInfo.protocol === '//') &&
    (!source || !isActionableSchemeUrl(source))
  ) {
    return undefined;
  }

  const host = schemeInfo.host || '';
  const path = schemeInfo.path || '';
  if (schemeInfo.protocol === '//') {
    return host || path ? `//${host}${path}` : undefined;
  }

  if (!host && !path) return schemeInfo.protocol;
  return `${schemeInfo.protocol}//${host}${path}`;
};

export const formatBase64MetaDisplayValue = (
  value: unknown,
  maxLength = DEFAULT_DISPLAY_LIMIT
): string => {
  const text = typeof value === 'string' ? value : stringifyUnknownValue(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const extractNonJsonSchemeCommandSummaryInfo = (
  decoded: string,
  schemeInfo?: SchemeDecodeResult['schemeInfo'],
  source?: string,
): SchemeCommandSummaryInfo | null => {
  const commandSchema = schemeInfo
    ? getCommandSchemaFromInfo(schemeInfo, source?.trim() || decoded)
    : undefined;
  const topCommandSchemas = commandSchema
    ? [{
        schema: commandSchema,
        count: 1,
        paths: ['$'],
        hasMorePaths: false,
      }]
    : [];
  return commandSchema
    ? {
        commandSchema,
        paramCount: 0,
        paramKeys: [],
        commandSchemaCount: topCommandSchemas.length,
        topCommandSchemas,
        commandFields: [],
        commandFieldRows: [],
        commandFieldCount: 0,
        resourceFields: [],
        resourceFieldRows: [],
        resourceFieldCount: 0,
        extFields: [],
        extFieldCount: 0,
        base64SuffixFields: [],
        base64SuffixFieldCount: 0,
      }
    : null;
};

export const extractSchemeCommandSummaryInfoFromContext = (
  context: SchemeMetadataContext,
  schemeInfo?: SchemeDecodeResult['schemeInfo'],
  options: SchemeCommandSummaryContextOptions = {},
): SchemeCommandSummaryInfo | null => {
  const rootObject = isPlainObject(context.decodedValue)
    ? context.decodedValue
    : null;
  const paramKeys = rootObject ? Object.keys(rootObject) : [];
  const fields = collectSchemeInsightFieldsFromSourceShape(
    context.decodedValue,
    context.sourceShape,
    options,
  );
  const commandSchema = schemeInfo
    ? getCommandSchemaFromInfo(schemeInfo, context.source)
    : undefined;
  const commandSchemaRows = [
    ...(commandSchema
      ? [{
          schema: commandSchema,
          path: '$',
          source: context.source || context.decoded,
        }]
      : []),
    ...collectCmdHandlerCommandSchemaRowsFromSourceShape(
      context.decodedValue,
      context.sourceShape,
    ),
  ];
  const primaryCommand = findPrimaryCommandCandidate(
    context.decodedValue,
    context.rawJsonSource,
  );
  const topCommandSchemas = buildCommandSchemaSummaries(
    commandSchemaRows,
    commandSchema || primaryCommand?.commandSchema
  );

  if (
    !commandSchema &&
    paramKeys.length === 0 &&
    commandSchemaRows.length === 0 &&
    fields.commandFields.length === 0 &&
    fields.resourceFields.length === 0 &&
    fields.extFields.length === 0 &&
    fields.base64SuffixFields.length === 0
  ) {
    return null;
  }

  return {
    commandSchema,
    paramCount: paramKeys.length,
    paramKeys,
    commandSchemaCount: commandSchemaRows.length,
    topCommandSchemas,
    ...fields,
  };
};

export const extractSchemeCommandSummaryInfo = (
  decoded: string,
  isJson: boolean,
  schemeInfo?: SchemeDecodeResult['schemeInfo'],
  options: SchemeInsightCollectOptions = {}
): SchemeCommandSummaryInfo | null => {
  if (!isJson) {
    return extractNonJsonSchemeCommandSummaryInfo(
      decoded,
      schemeInfo,
      options.source,
    );
  }

  const context = parseSchemeMetadataContext(decoded, options.source);
  return context
    ? extractSchemeCommandSummaryInfoFromContext(context, schemeInfo, options)
    : null;
};

export const extractBase64MetaInfoFromContext = (
  context: SchemeMetadataContext,
): Base64MetaInfo | null => {
  if (!isPlainObject(context.decodedValue)) return null;

  const prefix = typeof context.decodedValue._base64_prefix === 'string'
    ? context.decodedValue._base64_prefix
    : '';
  const suffix = typeof context.decodedValue._base64_suffix === 'string'
    ? context.decodedValue._base64_suffix
    : '';
  const suffixDecodePrefix = typeof context.decodedValue._base64_suffix_decode_prefix === 'string'
    ? context.decodedValue._base64_suffix_decode_prefix
    : '';
  const suffixDecodedObject = isPlainObject(context.decodedValue._base64_suffix_decoded)
    ? context.decodedValue._base64_suffix_decoded
    : null;
  const suffixDecodedEntries = suffixDecodedObject
    ? Object.entries(suffixDecodedObject).map(([key, value]) => ({
      key,
      displayValue: formatBase64MetaDisplayValue(value),
    }))
    : [];

  if (!prefix && !suffix && !suffixDecodePrefix && suffixDecodedEntries.length === 0) {
    return null;
  }

  return {
    prefix,
    suffix,
    suffixDecodePrefix,
    suffixLength: suffix.length,
    suffixDecodedCount: suffixDecodedEntries.length,
    suffixDecodedEntries,
  };
};

export const extractBase64MetaInfo = (
  decoded: string,
  isJson: boolean
): Base64MetaInfo | null => {
  if (!isJson) return null;

  const context = parseSchemeMetadataContext(decoded);
  return context ? extractBase64MetaInfoFromContext(context) : null;
};

export const formatCmdHandlerCompatibleResult = (
  decoded: string,
  commandSchema?: string,
  source?: string
): string => {
  const context = parseSchemeMetadataContext(decoded, source);
  return context
    ? formatCmdHandlerCompatibleResultFromContext(context, commandSchema)
    : '';
};

const formatCmdHandlerCompatibleResultFromContext = (
  context: SchemeMetadataContext,
  commandSchema?: string,
): string => {
  const inferredCommandSchema = commandSchema
    || getSchemeCommandSchemaFromSource(context.source);
  const result: CmdHandlerCompatibleResult = {
    result: {
      ...(inferredCommandSchema ? { cmdSchema: inferredCommandSchema } : {}),
      cmdParams: wrapNestedCmdHandlerParams(
        context.decodedValue,
        context.sourceShape,
      ),
      ...(context.source ? { source: context.source } : {}),
    },
  };

  return JSON.stringify(result, null, 2);
};

export const formatPrimaryCmdHandlerCompatibleResult = (
  decoded: string,
  commandSchema?: string,
  source?: string
): string => {
  const context = parseSchemeMetadataContext(decoded, source);
  if (!context) return '';
  if (commandSchema) {
    return formatCmdHandlerCompatibleResultFromContext(context, commandSchema);
  }

  const primaryCommand = findPrimaryCommandCandidate(
    context.decodedValue,
    context.rawJsonSource,
  );
  if (!primaryCommand) {
    return formatCmdHandlerCompatibleResultFromContext(context);
  }

  const inferredPrimaryCommandSchema = primaryCommand.commandSchema ||
    getSchemeCommandSchemaFromSource(primaryCommand.source);
  const result: CmdHandlerCompatibleResult = {
    result: {
      ...(inferredPrimaryCommandSchema ? { cmdSchema: inferredPrimaryCommandSchema } : {}),
      cmdParams: wrapNestedCmdHandlerParams(
        primaryCommand.decodedValue,
        parseSchemeMetadataSourceShape(primaryCommand.source)
      ),
      source: primaryCommand.source,
    },
  };

  return JSON.stringify(result, null, 2);
};
