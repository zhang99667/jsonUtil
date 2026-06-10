import type { SchemeDecodeResult } from './schemeUtils';

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
  extFields: string[];
  base64SuffixFields: string[];
}

export interface SchemeCommandSummaryInfo extends SchemeInsightFields {
  commandSchema?: string;
  paramCount: number;
  paramKeys: string[];
}

const DEFAULT_DISPLAY_LIMIT = 64;
const CMD_FIELD_NAMES = new Set([
  'cmd',
  'scheme',
  'convert_cmd',
  'panel_cmd',
  'webpanel_cmd',
  'stay_cmd',
  'reward_cmd',
  'strong_guide_cmd',
  'button_cmd',
  'button_scheme',
  'bottom_button_scheme',
  'panel_scheme',
  'click_event_cmd',
  'webpanel_event_cmd',
]);
const CMD_FIELD_SUFFIXES = ['_cmd', 'cmd', '_scheme', 'scheme'];
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

const isCmdInsightField = (key: string): boolean => {
  const normalizedKey = key.trim();
  const lowerKey = normalizedKey.toLowerCase();
  return CMD_FIELD_NAMES.has(normalizedKey) ||
    CMD_FIELD_NAMES.has(lowerKey) ||
    CMD_FIELD_SUFFIXES.some(suffix => lowerKey.endsWith(suffix));
};

const collectSchemeInsightFieldsInner = (
  value: unknown,
  commandFields: string[],
  extFields: string[],
  base64SuffixFields: string[]
) => {
  if (Array.isArray(value)) {
    value.forEach(item => collectSchemeInsightFieldsInner(item, commandFields, extFields, base64SuffixFields));
    return;
  }

  if (!isPlainObject(value)) return;

  Object.entries(value).forEach(([key, item]) => {
    if (isPlainObject(item)) {
      if (isCmdInsightField(key)) {
        commandFields.push(key);
      }
      if (EXT_FIELD_NAMES.has(key)) {
        extFields.push(key);
      }
      if (key === '_base64_suffix_decoded') {
        base64SuffixFields.push(...Object.keys(item));
      }
    }

    if (item && typeof item === 'object') {
      collectSchemeInsightFieldsInner(item, commandFields, extFields, base64SuffixFields);
    }
  });
};

export const collectSchemeInsightFields = (value: unknown): SchemeInsightFields => {
  const commandFields: string[] = [];
  const extFields: string[] = [];
  const base64SuffixFields: string[] = [];

  collectSchemeInsightFieldsInner(value, commandFields, extFields, base64SuffixFields);

  return {
    commandFields: dedupe(commandFields),
    extFields: dedupe(extFields),
    base64SuffixFields: dedupe(base64SuffixFields),
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
  schemeInfo?: SchemeDecodeResult['schemeInfo']
): SchemeCommandSummaryInfo | null => {
  if (!isJson) {
    const commandSchema = schemeInfo ? getCommandSchemaFromInfo(schemeInfo) : undefined;
    return commandSchema
      ? {
          commandSchema,
          paramCount: 0,
          paramKeys: [],
          commandFields: [],
          extFields: [],
          base64SuffixFields: [],
        }
      : null;
  }

  try {
    const parsed: unknown = JSON.parse(decoded);
    const rootObject = isPlainObject(parsed) ? parsed : null;
    const paramKeys = rootObject ? Object.keys(rootObject) : [];
    const fields = collectSchemeInsightFields(parsed);
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
