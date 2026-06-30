import type { SchemeDecodeResult } from './schemeTypes';
import {
  base64Decode,
  detectSchemeType,
  hasUrlEncoding,
  isActionableSchemeUrl,
  parseUrl,
  urlDecode,
} from './schemeUtils';
import { findSchemePrefixedQueryString } from './schemePrefixedQuery';

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

interface PrimaryCommandCandidate {
  decodedValue: unknown;
  source: string;
  commandSchema?: string;
  priority: number;
  depth: number;
  order: number;
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
const COMMA_QUERY_DELIMITER_RE = new RegExp(`,\\s*(?=${QUERY_KEY_PATTERN}=)`, 'g');
const LOG_FIELD_KEY_PATTERN = `(?:"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|${QUERY_KEY_PATTERN})`;
const LOG_FIELD_SEPARATOR_PATTERN = '(?:\\s*(?:=>|->)\\s*|\\s*[:：]\\s*|\\s+=\\s*|=\\s+)';
const LOG_FIELD_RE = new RegExp(`^\\s*(${LOG_FIELD_KEY_PATTERN})${LOG_FIELD_SEPARATOR_PATTERN}(.+?)\\s*$`);
const LOG_FIELD_WITH_PREFIX_RE = new RegExp(`^(.*?[\\s[{,(|])(${LOG_FIELD_KEY_PATTERN})${LOG_FIELD_SEPARATOR_PATTERN}(.+?)\\s*$`);
const HTML_EQUALS_RE = /&(?:equals|#61|#x3d);/gi;
const HTML_QUERY_DELIMITER_RE = new RegExp(`&(?:amp|#38|#x26);(?=${QUERY_KEY_PATTERN}=)`, 'gi');
const UNICODE_EQUALS_RE = /\\u003d/gi;
const UNICODE_AMP_QUERY_DELIMITER_RE = new RegExp(`\\\\u0026(?=${QUERY_KEY_PATTERN}=)`, 'gi');
const ESCAPED_LINE_QUERY_DELIMITER_RE = new RegExp(`(?:\\\\r\\\\n|\\\\n)[ \\t]*(?=${QUERY_KEY_PATTERN}=)`, 'g');
const LINE_QUERY_DELIMITER_RE = new RegExp(`\\r?\\n[ \\t]*(?=${QUERY_KEY_PATTERN}=)`, 'g');
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
  'schema',
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
const RESOURCE_FIELD_NAMES = new Set([
  'avatar',
  'avatarUrl',
  'avatarurl',
  'audio_url',
  'audioUrl',
  'audiourl',
  'bg_lottie_url',
  'bottom_button_icon',
  'button_icon',
  'button_image',
  'close_image',
  'cover',
  'coverUrl',
  'coverurl',
  'fail_lottie',
  'icon',
  'image',
  'imageUrl',
  'imageurl',
  'image_url',
  'icon_url',
  'iconUrl',
  'iconurl',
  'logo',
  'logo_url',
  'logoUrl',
  'logourl',
  'lottie',
  'lottieUrl',
  'lottieurl',
  'media_url',
  'mediaUrl',
  'mediaurl',
  'poster',
  'poster_image',
  'poster_url',
  'posterUrl',
  'posterurl',
  'portrait',
  'portrait_url',
  'portraitUrl',
  'portraiturl',
  'success_lottie',
  'swipe_up_lottie',
  'time_complete_lottie_url',
  'timer_front_icon',
  'top_image',
  'user_portrait',
  'video_url',
  'videoUrl',
  'videourl',
]);
const RESOURCE_FIELD_SUFFIXES = [
  '_avatar',
  '_avatar_url',
  '_cover',
  '_cover_url',
  '_icon',
  '_icon_url',
  '_image',
  '_image_url',
  '_lottie',
  '_lottie_url',
  '_logo',
  '_logo_url',
  '_poster',
  '_poster_url',
  '_portrait',
  '_portrait_url',
];
const EXT_FIELD_NAMES = new Set([
  'ad_extra_param',
  'extInfo',
  'ext_info',
  'adFlag',
]);
const PRIMARY_COMMAND_FIELD_PRIORITIES = new Map<string, number>([
  ['scheme', 100],
  ['cmd', 100],
  ['schema', 98],
  ['action_cmd', 96],
  ['actioncmd', 96],
  ['command', 94],
  ['convert_cmd', 92],
  ['panel_cmd', 90],
  ['webpanel_cmd', 90],
  ['panel_scheme', 88],
  ['stay_cmd', 86],
  ['reward_cmd', 86],
  ['strong_guide_cmd', 86],
  ['button_scheme', 82],
  ['bottom_button_scheme', 82],
  ['button_cmd', 78],
  ['callbackUrl', 40],
  ['callback_url', 40],
  ['url', 30],
  ['page_url', 28],
  ['lp_real_url', 28],
  ['click_url', 24],
  ['video_url', 10],
]);
const COMMAND_SCHEMA_SUMMARY_LIMIT = 6;
const COMMAND_SCHEMA_SUMMARY_PATH_LIMIT = 3;

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

const isResourceInsightField = (key: string): boolean => {
  const normalizedKey = key.trim();
  const lowerKey = normalizedKey.toLowerCase();
  return RESOURCE_FIELD_NAMES.has(normalizedKey) ||
    RESOURCE_FIELD_NAMES.has(lowerKey) ||
    RESOURCE_FIELD_SUFFIXES.some(suffix => lowerKey.endsWith(suffix));
};

const isCommandInsightField = (key: string): boolean => (
  isCmdInsightField(key) || isUrlInsightField(key)
);

const isResourceInsightValue = (value: unknown): boolean => {
  if (Boolean(value) && typeof value === 'object') return true;
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  return Boolean(trimmed) && detectSchemeType(trimmed) === 'url';
};

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
  value: unknown,
  sourceValue?: SourceShape
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

  const value = Object.prototype.hasOwnProperty.call(row, 'value')
    ? row.value
    : row.preview;
  return `${row.path} = ${formatInsightFieldCopyText(value)}`;
};

const collectSchemeInsightFieldsInner = (
  value: unknown,
  sourceShape: SourceShape | null,
  currentPath: string,
  commandFields: string[],
  commandFieldRows: SchemeInsightFieldRow[],
  resourceFields: string[],
  resourceFieldRows: SchemeInsightFieldRow[],
  extFields: string[],
  base64SuffixFields: string[],
  options: SchemeInsightCollectOptions
) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSchemeInsightFieldsInner(
      item,
      Array.isArray(sourceShape) ? sourceShape[index] ?? null : null,
      `${currentPath}[${index}]`,
      commandFields,
      commandFieldRows,
      resourceFields,
      resourceFieldRows,
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
    const childSourceShape = isPlainObject(sourceShape) ? sourceShape[key] : undefined;
    if (isResourceInsightField(key) && isResourceInsightValue(item)) {
      resourceFields.push(key);
      if (options.includeCommandFieldRows !== false) {
        resourceFieldRows.push(createInsightFieldRow(key, childPath, item, childSourceShape));
      }
    } else if (isObjectItem && isCommandInsightField(key)) {
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
        childSourceShape ?? null,
        childPath,
        commandFields,
        commandFieldRows,
        resourceFields,
        resourceFieldRows,
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
  const resourceFields: string[] = [];
  const resourceFieldRows: SchemeInsightFieldRow[] = [];
  const extFields: string[] = [];
  const base64SuffixFields: string[] = [];
  const sourceShape = parseSourceShape(options.source?.trim());

  collectSchemeInsightFieldsInner(
    value,
    sourceShape,
    '$',
    commandFields,
    commandFieldRows,
    resourceFields,
    resourceFieldRows,
    extFields,
    base64SuffixFields,
    options
  );

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

export const getUrlResourceSchemaFromUrl = (value: string): string | undefined => {
  const trimmed = value.trim().replace(/\\\//g, '/');
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return undefined;

  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return trimmed.split(/[?#]/)[0] || undefined;
  }
};

export const getSchemeCommandSchemaFromUrl = (value: string): string | undefined => {
  const trimmed = value.trim().replace(/\\\//g, '/');
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return undefined;
  if (!isActionableSchemeUrl(trimmed)) return undefined;

  return getUrlResourceSchemaFromUrl(trimmed);
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
  if (detectSchemeType(normalized) === 'base64') {
    const decoded = base64Decode(normalized);
    if (decoded && decoded !== normalized) {
      return parseSourceValue(decoded);
    }
  }

  const jsonValue = tryParseJsonSource(normalized);
  return jsonValue ?? normalized;
};

const parseSourceFieldKey = (rawKey: string): string | null => {
  const trimmed = rawKey.trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    if (quote === '"') {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return typeof parsed === 'string' ? parsed : null;
      } catch {
        return trimmed.slice(1, -1);
      }
    }

    return trimmed.slice(1, -1).replace(/\\'/g, "'");
  }

  return decodeQueryComponent(trimmed);
};

const parseSourceFieldValue = (rawValue: string): string => {
  const trimmed = rawValue.trim();
  const withoutTrailingComma = trimmed.endsWith(',') ? trimmed.slice(0, -1).trim() : trimmed;
  const quote = withoutTrailingComma[0];
  if ((quote === '"' || quote === "'") && withoutTrailingComma.endsWith(quote)) {
    if (quote === '"') {
      const parsed = tryParseJsonStringSource(withoutTrailingComma);
      return parsed ?? withoutTrailingComma.slice(1, -1);
    }

    return withoutTrailingComma.slice(1, -1).replace(/\\'/g, "'");
  }

  return withoutTrailingComma;
};

const normalizeQuerySourceString = (source: string): string => (
  source.trim()
    .replace(/^\?/, '')
    .replace(/^&+/, '')
    .replace(HTML_EQUALS_RE, '=')
    .replace(HTML_QUERY_DELIMITER_RE, '&')
    .replace(UNICODE_EQUALS_RE, '=')
    .replace(UNICODE_AMP_QUERY_DELIMITER_RE, '&')
    .replace(ESCAPED_LINE_QUERY_DELIMITER_RE, '&')
    .replace(LINE_QUERY_DELIMITER_RE, '&')
    .replace(COMMA_QUERY_DELIMITER_RE, '&')
);

const getQuerySourceShapeString = (source: string): string | null => {
  const normalizedSource = normalizeQuerySourceString(source);
  if (QUERY_PAIR_START_RE.test(normalizedSource)) return normalizedSource;

  const prefixedQuery = findSchemePrefixedQueryString(normalizedSource);
  if (!prefixedQuery) return null;

  const prefixedSource = normalizeQuerySourceString(prefixedQuery.queryString);
  return QUERY_PAIR_START_RE.test(prefixedSource) ? prefixedSource : null;
};

const parseLogFieldSourceShape = (source: string): SourceShape | null => {
  const trimmed = source.trim();
  if (/[\r\n]/.test(trimmed)) return null;

  const directMatch = trimmed.match(LOG_FIELD_RE);
  const prefixedMatch = directMatch ? null : trimmed.match(LOG_FIELD_WITH_PREFIX_RE);
  const rawKey = directMatch?.[1] ?? prefixedMatch?.[2];
  const rawValue = directMatch?.[2] ?? prefixedMatch?.[3];
  if (!rawKey || rawValue === undefined) return null;

  const key = parseSourceFieldKey(rawKey);
  if (!key) return null;

  return {
    [key]: parseSourceValue(parseSourceFieldValue(rawValue)),
  };
};

const parseQuerySourceShape = (source: string): SourceShape | null => {
  const normalizedSource = getQuerySourceShapeString(source);
  if (!normalizedSource) return parseLogFieldSourceShape(source);
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
    if (!isActionableSchemeUrl(source)) return null;

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

const getCommandSchemaFromSource = (source?: string): string | undefined => {
  if (!source) return undefined;
  const normalized = normalizeSourceString(source);
  return detectSchemeType(normalized) === 'url'
    ? getSchemeCommandSchemaFromUrl(normalized)
    : undefined;
};

const tryParseRawJsonSource = (source?: string): unknown | null => {
  const trimmed = source?.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return null;

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
};

const getRawSourceChild = (source: unknown, key: string, index?: number): unknown => {
  if (Array.isArray(source)) {
    return index === undefined ? undefined : source[index];
  }
  return isPlainObject(source) ? source[key] : undefined;
};

const getPrimaryCommandFieldPriority = (key: string): number => {
  const normalizedKey = key.trim();
  const lowerKey = normalizedKey.toLowerCase();
  return PRIMARY_COMMAND_FIELD_PRIORITIES.get(normalizedKey) ??
    PRIMARY_COMMAND_FIELD_PRIORITIES.get(lowerKey) ??
    (isCmdInsightField(key) ? 70 : isUrlInsightField(key) ? 20 : 0);
};

const collectPrimaryCommandCandidates = (
  decodedValue: unknown,
  rawSource: unknown,
  candidates: PrimaryCommandCandidate[],
  depth = 0,
  orderRef = { value: 0 }
) => {
  if (Array.isArray(decodedValue)) {
    decodedValue.forEach((item, index) => {
      collectPrimaryCommandCandidates(
        item,
        getRawSourceChild(rawSource, String(index), index),
        candidates,
        depth + 1,
        orderRef
      );
    });
    return;
  }

  if (!isPlainObject(decodedValue)) return;

  Object.entries(decodedValue).forEach(([key, item]) => {
    const rawChild = getRawSourceChild(rawSource, key);
    const commandSourceInfo = isPlainObject(item) && isCommandInsightField(key) && typeof rawChild === 'string'
      ? getCommandSourceInfo(rawChild)
      : null;

    if (commandSourceInfo) {
      candidates.push({
        decodedValue: item,
        source: commandSourceInfo.source,
        ...(commandSourceInfo.cmdSchema ? { commandSchema: commandSourceInfo.cmdSchema } : {}),
        priority: getPrimaryCommandFieldPriority(key),
        depth,
        order: orderRef.value,
      });
      orderRef.value += 1;
    }

    collectPrimaryCommandCandidates(item, rawChild, candidates, depth + 1, orderRef);
  });
};

const findPrimaryCommandCandidate = (
  cmdParams: unknown,
  source?: string
): PrimaryCommandCandidate | null => {
  const rawSource = tryParseRawJsonSource(source);
  if (!rawSource) return null;

  const candidates: PrimaryCommandCandidate[] = [];
  collectPrimaryCommandCandidates(cmdParams, rawSource, candidates);
  if (candidates.length === 0) return null;

  return candidates.sort((left, right) => (
    right.priority - left.priority ||
    left.depth - right.depth ||
    left.order - right.order
  ))[0];
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
    const commandSchema = schemeInfo ? getCommandSchemaFromInfo(schemeInfo, options.source?.trim() || decoded) : undefined;
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
  }

  try {
    const parsed: unknown = JSON.parse(decoded);
    const rootObject = isPlainObject(parsed) ? parsed : null;
    const paramKeys = rootObject ? Object.keys(rootObject) : [];
    const fields = collectSchemeInsightFields(parsed, options);
    const commandSchema = schemeInfo ? getCommandSchemaFromInfo(schemeInfo, options.source?.trim() || decoded) : undefined;
    const commandSchemaRows = [
      ...(commandSchema
        ? [{
            schema: commandSchema,
            path: '$',
            source: options.source?.trim() || decoded,
          }]
        : []),
      ...collectCmdHandlerCommandSchemaRows(parsed, options.source),
    ];
    const primaryCommand = findPrimaryCommandCandidate(parsed, options.source);
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
    const inferredCommandSchema = commandSchema || getCommandSchemaFromSource(sourceValue);
    const result: CmdHandlerCompatibleResult = {
      result: {
        ...(inferredCommandSchema ? { cmdSchema: inferredCommandSchema } : {}),
        cmdParams: wrapNestedCmdHandlerParams(cmdParams, sourceShape),
        ...(sourceValue ? { source: sourceValue } : {}),
      },
    };

    return JSON.stringify(result, null, 2);
  } catch {
    return '';
  }
};

export const formatPrimaryCmdHandlerCompatibleResult = (
  decoded: string,
  commandSchema?: string,
  source?: string
): string => {
  try {
    const cmdParams: unknown = JSON.parse(decoded);
    if (commandSchema) {
      return formatCmdHandlerCompatibleResult(decoded, commandSchema, source);
    }

    const primaryCommand = findPrimaryCommandCandidate(cmdParams, source);
    if (!primaryCommand) {
      return formatCmdHandlerCompatibleResult(decoded, commandSchema, source);
    }

    const inferredPrimaryCommandSchema = primaryCommand.commandSchema ||
      getCommandSchemaFromSource(primaryCommand.source);
    const result: CmdHandlerCompatibleResult = {
      result: {
        ...(inferredPrimaryCommandSchema ? { cmdSchema: inferredPrimaryCommandSchema } : {}),
        cmdParams: wrapNestedCmdHandlerParams(
          primaryCommand.decodedValue,
          parseSourceShape(primaryCommand.source)
        ),
        source: primaryCommand.source,
      },
    };

    return JSON.stringify(result, null, 2);
  } catch {
    return '';
  }
};
