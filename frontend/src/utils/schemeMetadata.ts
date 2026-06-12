import type { SchemeDecodeResult } from './schemeUtils';
import { detectSchemeType, hasUrlEncoding, parseUrl, urlDecode } from './schemeUtils';

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
}

export interface SchemeCommandSummaryInfo extends SchemeInsightFields {
  commandSchema?: string;
  paramCount: number;
  paramKeys: string[];
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
}

type SourceShape =
  | string
  | number
  | boolean
  | null
  | SourceShape[]
  | { [key: string]: SourceShape };

const DEFAULT_DISPLAY_LIMIT = 64;
const QUERY_KEY_PATTERN = '[A-Za-z0-9_.\\-[\\]%]+';
const QUERY_PAIR_START_RE = new RegExp(`^${QUERY_KEY_PATTERN}=`);
const QUERY_PAIR_DELIMITER_RE = new RegExp(`[&;](?=${QUERY_KEY_PATTERN}=)`);
const CMD_FIELD_NAMES = new Set([
  'cmd',
  'action_cmd',
  'actioncmd',
  'actioncommand',
  'action-command',
  'command',
  'cmd_param',
  'cmd_params',
  'command_param',
  'command_params',
  'scheme',
  'schema_url',
  'schemaurl',
  'scheme_url',
  'schemeurl',
  'convert_cmd',
  'panel_cmd',
  'webpanel_cmd',
  'stay_cmd',
  'reward_cmd',
  'strong_guide_cmd',
  'button_cmd',
  'convert_btn',
  'main_btn',
  'bottom_left_btn',
  'bottom_right_btn',
  'button_scheme',
  'bottom_button_scheme',
  'panel_scheme',
  'click_event_cmd',
  'webpanel_event_cmd',
]);
const CMD_FIELD_SUFFIXES = ['_cmd', 'cmd', '_scheme', 'scheme'];
const URL_FIELD_NAMES = new Set([
  'url',
  'uri',
  'link',
  'target',
  'target_url',
  'redirect',
  'redirect_url',
  'next',
  'next_url',
  'fallback_url',
  'deep_link',
  'deeplink',
  'jump_url',
  'landing_url',
  'landing_page_url',
  'h5_url',
  'page_url',
  'web_url',
  'detail_url',
  'lp_real_url',
  'app_url',
  'appurl',
  'open_app_url',
  'download_url',
  'apk_url',
  'deeplink_url',
  'deep_link_url',
  'callback_url',
  'callback',
  'open_url',
  'ad_monitor_url',
  'monitor_url',
  'click_url',
  'weburl',
  'appUrl',
  'webUrl',
  'openUrl',
]);
const URL_FIELD_SUFFIXES = ['_url', 'url'];
const EXT_FIELD_NAMES = new Set([
  'ad_extra_param',
  'extInfo',
  'ext_info',
  'adFlag',
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const dedupe = (values: string[]): string[] => (
  Array.from(new Set(values)).filter(Boolean)
);

const appendJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const isCmdInsightField = (key: string): boolean => {
  const normalizedKey = key.trim();
  const lowerKey = normalizedKey.toLowerCase();
  return CMD_FIELD_NAMES.has(normalizedKey) ||
    CMD_FIELD_NAMES.has(lowerKey) ||
    CMD_FIELD_SUFFIXES.some(suffix => lowerKey.endsWith(suffix));
};

const isUrlInsightField = (key: string): boolean => {
  const normalizedKey = key.trim();
  const lowerKey = normalizedKey.toLowerCase();
  return URL_FIELD_NAMES.has(normalizedKey) ||
    URL_FIELD_NAMES.has(lowerKey) ||
    URL_FIELD_SUFFIXES.some(suffix => lowerKey.endsWith(suffix));
};

const isCommandInsightField = (key: string): boolean => (
  isCmdInsightField(key) || isUrlInsightField(key)
);

const formatInsightFieldCopyText = (value: unknown, maxLength = 8_000): string => {
  const text = typeof value === 'string'
    ? JSON.stringify(value)
    : JSON.stringify(value) ?? String(value);

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
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
  value: unknown
): SchemeInsightFieldRow => ({
  key,
  path,
  preview: formatInsightFieldPreview(value),
  value,
});

export const getSchemeInsightFieldCopyText = (
  row: SchemeInsightFieldRow
): string => {
  if (row.copyText !== undefined) return row.copyText;

  const value = Object.prototype.hasOwnProperty.call(row, 'value')
    ? row.value
    : row.preview;
  return `${row.path} = ${formatInsightFieldCopyText(value)}`;
};

const collectSchemeInsightFieldsInner = (
  value: unknown,
  currentPath: string,
  commandFields: string[],
  commandFieldRows: SchemeInsightFieldRow[],
  extFields: string[],
  base64SuffixFields: string[],
  options: SchemeInsightCollectOptions
) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSchemeInsightFieldsInner(
      item,
      `${currentPath}[${index}]`,
      commandFields,
      commandFieldRows,
      extFields,
      base64SuffixFields,
      options
    ));
    return;
  }

  if (!isPlainObject(value)) return;

  Object.entries(value).forEach(([key, item]) => {
    const childPath = appendJsonPathKey(currentPath, key);
    const isObjectItem = Boolean(item) && typeof item === 'object';
    if (isObjectItem && isCommandInsightField(key)) {
      commandFields.push(key);
      if (options.includeCommandFieldRows !== false) {
        commandFieldRows.push(createInsightFieldRow(key, childPath, item));
      }
    }

    if (isPlainObject(item)) {
      if (EXT_FIELD_NAMES.has(key)) {
        extFields.push(key);
      }
      if (key === '_base64_suffix_decoded') {
        base64SuffixFields.push(...Object.keys(item));
      }
    }

    if (isObjectItem) {
      collectSchemeInsightFieldsInner(
        item,
        childPath,
        commandFields,
        commandFieldRows,
        extFields,
        base64SuffixFields,
        options
      );
    }
  });
};

export const collectSchemeInsightFields = (
  value: unknown,
  options: SchemeInsightCollectOptions = {}
): SchemeInsightFields => {
  const commandFields: string[] = [];
  const commandFieldRows: SchemeInsightFieldRow[] = [];
  const extFields: string[] = [];
  const base64SuffixFields: string[] = [];

  collectSchemeInsightFieldsInner(
    value,
    '$',
    commandFields,
    commandFieldRows,
    extFields,
    base64SuffixFields,
    options
  );

  return {
    commandFields: dedupe(commandFields),
    commandFieldRows,
    commandFieldCount: commandFields.length,
    extFields: dedupe(extFields),
    extFieldCount: extFields.length,
    base64SuffixFields: dedupe(base64SuffixFields),
    base64SuffixFieldCount: base64SuffixFields.length,
  };
};

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

export const getSchemeCommandSchemaFromUrl = (value: string): string | undefined => {
  const trimmed = value.trim().replace(/\\\//g, '/');
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return undefined;

  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return trimmed.split(/[?#]/)[0] || undefined;
  }
};

const normalizeSourceString = (value: string): string => {
  let current = value.trim().replace(/\\\//g, '/');

  for (let depth = 0; depth < 3 && hasUrlEncoding(current); depth++) {
    if (detectSchemeType(current) !== 'url-encoded') break;

    const decoded = urlDecode(current);
    if (decoded === current) break;
    current = decoded;
  }

  return current;
};

const decodeQueryComponent = (value: string): string => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
};

const mergeSourceValue = (
  existing: SourceShape | undefined,
  value: SourceShape
): SourceShape => {
  if (existing === undefined) return value;
  if (Array.isArray(existing)) return [...existing, value];
  return [existing, value];
};

const tryParseJsonSource = (value: string): SourceShape | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return normalizeSourceShape(parsed);
  } catch {
    return null;
  }
};

const tryParseJsonStringSource = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return typeof parsed === 'string' ? parsed : null;
  } catch {
    return null;
  }
};

const normalizeSourceShape = (value: unknown): SourceShape => {
  if (typeof value === 'string') {
    return parseSourceValue(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeSourceShape(item));
  }

  if (isPlainObject(value)) {
    const result: { [key: string]: SourceShape } = {};
    Object.entries(value).forEach(([key, item]) => {
      result[key] = normalizeSourceShape(item);
    });
    return result;
  }

  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (value === null) return null;

  return String(value);
};

const parseSourceValue = (value: string): SourceShape => {
  const jsonStringPayload = tryParseJsonStringSource(value);
  if (jsonStringPayload !== null) {
    return parseSourceValue(jsonStringPayload);
  }

  const directJsonValue = tryParseJsonSource(value);
  if (directJsonValue !== null) return directJsonValue;

  const normalized = normalizeSourceString(value);
  const jsonValue = tryParseJsonSource(normalized);
  return jsonValue ?? normalized;
};

const parseQuerySourceShape = (source: string): SourceShape | null => {
  const normalizedSource = source.trim().replace(/^\?/, '').replace(/^&+/, '');
  if (!QUERY_PAIR_START_RE.test(normalizedSource)) return null;

  const result: { [key: string]: SourceShape } = {};
  normalizedSource.split(QUERY_PAIR_DELIMITER_RE).forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = decodeQueryComponent(pair.slice(0, equalIndex));
    if (!key) return;

    const value = parseSourceValue(decodeQueryComponent(pair.slice(equalIndex + 1)));
    result[key] = mergeSourceValue(result[key], value);
  });

  return Object.keys(result).length > 0 ? result : null;
};

const parseSourceShape = (source?: string): SourceShape | null => {
  if (!source?.trim()) return null;

  const normalized = normalizeSourceString(source);
  const sourceType = detectSchemeType(normalized);
  if (sourceType === 'url') {
    const schemeInfo = parseUrl(normalized);
    const queryShape = schemeInfo?.params ? normalizeSourceShape(schemeInfo.params) : null;
    const hashShape = schemeInfo?.hashParams ? normalizeSourceShape(schemeInfo.hashParams) : null;

    if (queryShape && hashShape && isPlainObject(queryShape)) {
      return {
        ...queryShape,
        _hash: hashShape,
      };
    }

    return queryShape || hashShape;
  }
  if (sourceType === 'query-string') {
    return parseQuerySourceShape(normalized);
  }

  const jsonValue = tryParseJsonSource(normalized);
  return jsonValue;
};

const getSourceObjectChild = (
  sourceShape: SourceShape | null,
  key: string
): SourceShape | undefined => (
  isPlainObject(sourceShape) ? sourceShape[key] : undefined
);

const getCommandSourceInfo = (
  sourceShape: SourceShape | undefined
): { cmdSchema?: string; source: string } | null => {
  if (typeof sourceShape !== 'string') return null;

  const source = normalizeSourceString(sourceShape);
  const sourceType = detectSchemeType(source);
  if (sourceType === 'url') {
    const cmdSchema = getSchemeCommandSchemaFromUrl(source);
    return {
      ...(cmdSchema ? { cmdSchema } : {}),
      source,
    };
  }

  if (sourceType === 'query-string') {
    return { source };
  }

  return null;
};

const wrapNestedCmdHandlerParams = (
  value: unknown,
  sourceShape: SourceShape | null
): unknown => {
  if (Array.isArray(value)) {
    const sourceItems = Array.isArray(sourceShape) ? sourceShape : [];
    return value.map((item, index) => (
      wrapNestedCmdHandlerParams(item, sourceItems[index] ?? null)
    ));
  }

  if (!isPlainObject(value)) return value;

  const result: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, item]) => {
    const childSource = getSourceObjectChild(sourceShape, key);
    const childSourceShape = typeof childSource === 'string'
      ? parseSourceShape(childSource)
      : childSource ?? null;
    const wrappedItem = wrapNestedCmdHandlerParams(item, childSourceShape);
    const commandSourceInfo = isCommandInsightField(key) && isPlainObject(wrappedItem)
      ? getCommandSourceInfo(childSource)
      : null;

    result[key] = commandSourceInfo
      ? {
          ...(commandSourceInfo.cmdSchema ? { cmdSchema: commandSourceInfo.cmdSchema } : {}),
          cmdParams: wrappedItem,
          source: commandSourceInfo.source,
        }
      : wrappedItem;
  });

  return result;
};

const collectNestedCommandSchemaRowsInner = (
  value: unknown,
  sourceShape: SourceShape | null,
  currentPath: string,
  rows: CmdHandlerCommandSchemaRow[]
) => {
  if (Array.isArray(value)) {
    const sourceItems = Array.isArray(sourceShape) ? sourceShape : [];
    value.forEach((item, index) => {
      collectNestedCommandSchemaRowsInner(item, sourceItems[index] ?? null, `${currentPath}[${index}]`, rows);
    });
    return;
  }

  if (!isPlainObject(value)) return;

  Object.entries(value).forEach(([key, item]) => {
    const childPath = appendJsonPathKey(currentPath, key);
    const childSource = getSourceObjectChild(sourceShape, key);
    const childSourceShape = typeof childSource === 'string'
      ? parseSourceShape(childSource)
      : childSource ?? null;
    const commandSourceInfo = isCommandInsightField(key) && isPlainObject(item)
      ? getCommandSourceInfo(childSource)
      : null;

    if (commandSourceInfo?.cmdSchema) {
      rows.push({
        schema: commandSourceInfo.cmdSchema,
        path: childPath,
        source: commandSourceInfo.source,
      });
    }

    collectNestedCommandSchemaRowsInner(item, childSourceShape, childPath, rows);
  });
};

export const collectCmdHandlerCommandSchemaRows = (
  decodedValue: unknown,
  source?: string
): CmdHandlerCommandSchemaRow[] => {
  const rows: CmdHandlerCommandSchemaRow[] = [];
  collectNestedCommandSchemaRowsInner(decodedValue, parseSourceShape(source?.trim()), '$', rows);
  return rows;
};

const getCommandSchemaFromInfo = (
  schemeInfo: SchemeDecodeResult['schemeInfo']
): string | undefined => {
  if (!schemeInfo?.protocol || schemeInfo.protocol === '无协议') return undefined;

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
  let text: string;

  if (typeof value === 'string') {
    text = value;
  } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    text = String(value);
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export const extractSchemeCommandSummaryInfo = (
  decoded: string,
  isJson: boolean,
  schemeInfo?: SchemeDecodeResult['schemeInfo'],
  options: SchemeInsightCollectOptions = {}
): SchemeCommandSummaryInfo | null => {
  if (!isJson) {
    const commandSchema = schemeInfo ? getCommandSchemaFromInfo(schemeInfo) : undefined;
    return commandSchema
      ? {
          commandSchema,
          paramCount: 0,
          paramKeys: [],
          commandFields: [],
          commandFieldRows: [],
          commandFieldCount: 0,
          extFields: [],
          extFieldCount: 0,
          base64SuffixFields: [],
          base64SuffixFieldCount: 0,
        }
      : null;
  }

  try {
    const parsed: unknown = JSON.parse(decoded);
    const rootObject = isPlainObject(parsed) ? parsed : null;
    const paramKeys = rootObject ? Object.keys(rootObject) : [];
    const fields = collectSchemeInsightFields(parsed, options);
    const commandSchema = schemeInfo ? getCommandSchemaFromInfo(schemeInfo) : undefined;

    if (
      !commandSchema &&
      paramKeys.length === 0 &&
      fields.commandFields.length === 0 &&
      fields.extFields.length === 0 &&
      fields.base64SuffixFields.length === 0
    ) {
      return null;
    }

    return {
      commandSchema,
      paramCount: paramKeys.length,
      paramKeys,
      ...fields,
    };
  } catch {
    return null;
  }
};

export const extractBase64MetaInfo = (
  decoded: string,
  isJson: boolean
): Base64MetaInfo | null => {
  if (!isJson) return null;

  try {
    const parsed: unknown = JSON.parse(decoded);
    if (!isPlainObject(parsed)) return null;

    const prefix = typeof parsed._base64_prefix === 'string' ? parsed._base64_prefix : '';
    const suffix = typeof parsed._base64_suffix === 'string' ? parsed._base64_suffix : '';
    const suffixDecodePrefix = typeof parsed._base64_suffix_decode_prefix === 'string'
      ? parsed._base64_suffix_decode_prefix
      : '';
    const suffixDecodedObject = isPlainObject(parsed._base64_suffix_decoded)
      ? parsed._base64_suffix_decoded
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
  } catch {
    return null;
  }
};

export const formatCmdHandlerCompatibleResult = (
  decoded: string,
  commandSchema?: string,
  source?: string
): string => {
  try {
    const cmdParams: unknown = JSON.parse(decoded);
    const sourceValue = source?.trim();
    const sourceShape = parseSourceShape(sourceValue);
    const result: CmdHandlerCompatibleResult = {
      result: {
        ...(commandSchema ? { cmdSchema: commandSchema } : {}),
        cmdParams: wrapNestedCmdHandlerParams(cmdParams, sourceShape),
        ...(sourceValue ? { source: sourceValue } : {}),
      },
    };

    return JSON.stringify(result, null, 2);
  } catch {
    return '';
  }
};
