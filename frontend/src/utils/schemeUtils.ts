/**
 * Scheme 字符串检测和编解码工具
 * 支持 URL、Base64、JWT 等常见 scheme 的识别和解析
 */
import { isKnownDecodableParamName } from './structuredParamNames';
import {
  collectRuntimePlaceholders,
  getRuntimePlaceholderDescription,
  isRuntimePlaceholder,
} from './schemePlaceholders';
import {
  createUrl,
  isBareHostUrl,
  isProtocolRelativeUrl,
  normalizeJsonUrlEscapes,
} from './schemeUrlShapes';
import {
  QUERY_PAIR_START_RE,
  looksLikeQueryString,
  normalizeQueryString,
  splitQueryPairs,
  stripQueryPrefix,
} from './schemeQuerySyntax';
import {
  getSchemePrefixedQueryString,
  isDecodableSchemePrefixedQueryString,
  isDecodableSchemeQueryString,
  isSchemeQueryStringFormat,
  type SchemeQueryDetectionOptions,
} from './schemeQueryDetection';
import {
  assignQueryParam,
  type StructuredQueryParamContainer,
} from './schemeStructuredQuery';
import {
  decodeQueryComponent,
  decodeQueryValueComponent as decodeSchemeQueryValueComponent,
  urlDecode,
} from './schemeQueryDecoding';
import {
  isDecodableSchemeLogFieldParamString,
  parseSchemeLogFieldParamString,
  type SchemeLogFieldParam,
} from './schemeLogFields';
import {
  getFragmentParamSource as getSchemeFragmentParamSource,
  getFragmentParamSourceInfo as getSchemeFragmentParamSourceInfo,
  isDecodableFragmentParamString as isDecodableSchemeFragmentParamString,
} from './schemeFragmentParams';
import {
  isJsonString,
  normalizeHtmlJsonQuoteCandidate,
  normalizeJsonEscapedQuoteCandidate,
  tryNormalizeHtmlJsonQuotePayload,
  tryNormalizeJsonEscapedQuotePayload,
  tryParseJson,
  tryParseJsonWithMeta,
} from './schemeJsonPayloads';
import {
  tryNormalizeJsonEscapedSlashPayload,
  tryNormalizeJsonUnicodeAsciiPayload,
} from './schemeEscapedPayloads';
import {
  buildSchemeStructuredDecodeWarnings,
  createSchemeStructuredDecodeState,
  shouldSkipSchemeStructuredStringDecode,
  type SchemeStructuredDecodeState,
} from './schemeStructuredDecodeGuards';
import {
  base64Decode as decodeSchemeBase64,
  base64Encode,
  decodeBase64WithMeta as decodeSchemeBase64WithMeta,
  decodeJwt,
  isBase64 as isSchemeBase64,
  type SchemeBase64DecodeOptions,
} from './schemeBase64';
import {
  getSingleRawStructuredParam,
  getSingleRawUrlParam,
  type SchemeRawParamOptions,
} from './schemeRawParams';
import {
  encodeWithSchemeLayers,
  type SchemeLayerEncodingOptions,
} from './schemeLayerEncoding';
import {
  isActionableSchemeUrlWithOptions,
  shouldExposeSchemeValueWithOptions,
  type SchemeExposureOptions,
} from './schemeExposure';
import { parseSchemeUrlInfo } from './schemeUrlInfo';
import {
  buildQueryStringParamDecodeStages,
  buildUrlParamDecodeStages,
  formatPlaceholderPathSegment,
} from './schemeParamDecodeStages';
import {
  DEFAULT_SCHEME_DECODE_MAX_DEPTH,
  type DecodeLayer,
  type SchemeDecodeResult,
  type SchemeDecodeWarning,
  type SchemeParamDecodeStage,
  type SchemePlaceholder,
  type SchemeType,
  type StructuredValue,
} from './schemeTypes';

export {
  buildSchemePlaceholderGroups,
  isRuntimePlaceholder,
} from './schemePlaceholders';

export {
  base64Encode,
  decodeJwt,
};

export {
  isJsonString,
};

export {
  urlDecode,
};

export {
  DEFAULT_SCHEME_JSON_STRING_DECODE_LIMIT,
  DEFAULT_SCHEME_JSON_TOTAL_STRING_DECODE_LIMIT,
} from './schemeStructuredDecodeGuards';

export { DEFAULT_SCHEME_DECODE_MAX_DEPTH } from './schemeTypes';
export type {
  DecodeLayer,
  SchemeDecodeResult,
  SchemeDecodeWarning,
  SchemeParamDecodeStage,
  SchemePlaceholder,
  SchemePlaceholderGroup,
  SchemeType,
} from './schemeTypes';

// ============ 类型契约兼容导出 ============

const looksLikeStructuredPayload = (value: string): boolean => {
  const trimmed = value.trim();
  const slashNormalized = normalizeJsonUrlEscapes(trimmed);
  if (slashNormalized !== trimmed) {
    return looksLikeStructuredPayload(slashNormalized);
  }

  const htmlJsonPayload = tryNormalizeHtmlJsonQuotePayload(trimmed);
  if (htmlJsonPayload !== null) {
    return looksLikeStructuredPayload(htmlJsonPayload);
  }

  return isJsonString(trimmed) ||
    isUrl(trimmed) ||
    hasUrlEncoding(trimmed) ||
    isJwt(trimmed) ||
    looksLikeQueryString(trimmed);
};

const createSchemeBase64DecodeOptions = (): SchemeBase64DecodeOptions => ({
  isJsonString,
  looksLikeStructuredPayload,
  decodeNestedParamValue: (value) => decodeNestedParamValue(value, DEFAULT_SCHEME_DECODE_MAX_DEPTH),
});

const decodeBase64WithMeta = (input: string) => (
  decodeSchemeBase64WithMeta(input, createSchemeBase64DecodeOptions())
);

/**
 * Base64 解码
 */
export function base64Decode(str: string): string {
  return decodeSchemeBase64(str, createSchemeBase64DecodeOptions());
}

/**
 * 检测字符串是否为有效的 Base64
 * 需要一定长度且符合 Base64 字符集
 */
export function isBase64(str: string): boolean {
  return isSchemeBase64(str, createSchemeBase64DecodeOptions());
}

const isStructuredBase64Value = (value: string): boolean => {
  const decoded = base64Decode(value);
  return decoded !== value && looksLikeStructuredPayload(decoded);
};

const isDecodableParamValue = (value: string): boolean => (
  isRuntimePlaceholder(value) ||
  tryNormalizeJsonEscapedSlashPayload(value, looksLikeStructuredPayload) !== null ||
  tryNormalizeJsonUnicodeAsciiPayload(value, looksLikeStructuredPayload) !== null ||
  tryNormalizeJsonEscapedQuotePayload(value) !== null ||
  tryNormalizeHtmlJsonQuotePayload(value) !== null ||
  hasUrlEncoding(value) ||
  isUrl(value) ||
  isJwt(value) ||
  isBase64(value) ||
  isJsonString(value) ||
  isStructuredBase64Value(value)
);

// ============ 检测函数 ============

/**
 * 检测字符串是否为 URL（包含协议）
 */
export function isUrl(str: string): boolean {
  const trimmed = normalizeJsonUrlEscapes(str.trim());
  // 匹配 scheme://...、//host/path 和 host/path 这几类常见链接格式
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.+/.test(trimmed) ||
    isProtocolRelativeUrl(trimmed) ||
    isBareHostUrl(trimmed);
}

/**
 * 检测字符串是否为 URL 查询参数格式 (key=value&key=value...)
 * 这种格式不应该被识别为需要解析的 scheme
 */
export function isQueryStringFormat(str: string): boolean {
  return isSchemeQueryStringFormat(str);
}

/**
 * 检测字符串是否像需要解析的 CMD 参数串
 * 单个 key=value 只有在 key 常见且 value 可继续解析时才命中，避免普通文本误判
 */
export function isDecodableQueryString(str: string): boolean {
  return isDecodableSchemeQueryString(str, createSchemeQueryDetectionOptions());
}

const createSchemeQueryDetectionOptions = (): SchemeQueryDetectionOptions => ({
  isKnownParamName: isKnownDecodableParamName,
  isDecodableValue: isDecodableParamValue,
});

const getPrefixedQueryString = (source: string) => (
  getSchemePrefixedQueryString(source, createSchemeQueryDetectionOptions())
);

const isDecodablePrefixedQueryString = (source: string): boolean => (
  isDecodableSchemePrefixedQueryString(source, createSchemeQueryDetectionOptions())
);

/**
 * 检测字符串是否包含 URL 编码
 */
export function hasUrlEncoding(str: string): boolean {
  // 必须包含 %XX 格式的编码
  if (!/%[0-9A-Fa-f]{2}/.test(str)) return false;
  
  // 排除纯粹的查询参数格式（如 key=value&key=value）
  // 这种格式虽然可能包含 URL 编码，但不是我们要解析的 scheme
  if (isQueryStringFormat(str)) return false;
  
  return true;
}

/**
 * 检测字符串是否为 JWT Token
 */
export function isJwt(str: string): boolean {
  const trimmed = str.trim();
  // JWT 格式: header.payload.signature
  const parts = trimmed.split('.');
  if (parts.length !== 3) return false;
  if (!parts.every(part => part && /^[A-Za-z0-9_-]+$/.test(part))) return false;

  // header/payload 必须能解成 JSON 对象，避免把版本号 1.2.3 误判成 JWT。
  return decodeJwt(trimmed) !== null;
}

/**
 * 检测字符串的 scheme 类型
 */
export function detectSchemeType(str: string): SchemeType {
  if (!str || typeof str !== 'string') return 'plain';

  const trimmed = str.trim();
  const jsonStringPayload = tryParseJsonStringPayload(trimmed);
  if (jsonStringPayload !== null) {
    return detectSchemeType(jsonStringPayload);
  }

  const escapedSlashPayload = tryNormalizeJsonEscapedSlashPayload(trimmed, looksLikeStructuredPayload);
  if (escapedSlashPayload !== null) {
    return detectSchemeType(escapedSlashPayload);
  }

  const unicodeAsciiPayload = tryNormalizeJsonUnicodeAsciiPayload(trimmed, looksLikeStructuredPayload);
  if (unicodeAsciiPayload !== null) {
    return detectSchemeType(unicodeAsciiPayload);
  }

  const escapedQuotePayload = tryNormalizeJsonEscapedQuotePayload(trimmed);
  if (escapedQuotePayload !== null) {
    return detectSchemeType(escapedQuotePayload);
  }

  const htmlJsonPayload = tryNormalizeHtmlJsonQuotePayload(trimmed);
  if (htmlJsonPayload !== null) {
    return detectSchemeType(htmlJsonPayload);
  }

  // 优先级顺序很重要
  if (isJsonString(trimmed)) return 'json';
  if (isJwt(trimmed)) return 'jwt';
  if (isUrl(trimmed)) return 'url';
  if (isDecodableFragmentParamString(trimmed)) return 'query-string';
  if (isDecodableLogFieldParamString(trimmed)) return 'query-string';
  if (isDecodableQueryString(trimmed)) return 'query-string';
  if (isDecodablePrefixedQueryString(trimmed)) return 'query-string';
  if (hasUrlEncoding(trimmed)) return 'url-encoded';
  if (isBase64(trimmed)) return 'base64';

  return 'plain';
}

/**
 * 检测字符串是否包含需要解析的 scheme
 */
export function hasScheme(str: string): boolean {
  return shouldExposeSchemeValue(str);
}

// ============ 解码函数 ============

const decodeQueryValueComponent = (str: string): string => (
  decodeSchemeQueryValueComponent(str, isDecodableParamValue)
);

const parseLogFieldParamString = (source: string): SchemeLogFieldParam | null => (
  parseSchemeLogFieldParamString(source, {
    decodeKey: decodeQueryComponent,
    isDecodableValue: isDecodableParamValue,
  })
);

const isDecodableLogFieldParamString = (source: string): boolean => (
  isDecodableSchemeLogFieldParamString(source, {
    decodeKey: decodeQueryComponent,
    isDecodableValue: isDecodableParamValue,
  })
);

/**
 * URL 编码
 */
export function urlEncode(str: string): string {
  return encodeURIComponent(str);
}

const createRawParamOptions = (): SchemeRawParamOptions => ({
  decodeKey: decodeQueryComponent,
  decodeValue: decodeQueryValueComponent,
  isKnownParamName: isKnownDecodableParamName,
  isUrlValue: isUrl,
  isJsonValue: value => tryParseJson(value) !== null,
});

const getFragmentParamSourceInfo = (hash: string) => (
  getSchemeFragmentParamSourceInfo(hash, urlDecode)
);

const getFragmentParamSource = (hash: string): string | null => (
  getSchemeFragmentParamSource(hash, urlDecode)
);

const isDecodableFragmentParamString = (source: string): boolean => (
  isDecodableSchemeFragmentParamString(source, {
    decodeUrl: urlDecode,
    isDecodableQueryString,
  })
);

const createSchemeExposureOptions = (): SchemeExposureOptions => ({
  base64Decode,
  decodeQueryKey: decodeQueryComponent,
  decodeQueryValue: decodeQueryValueComponent,
  detectSchemeType,
  getFragmentParamSource,
  hasUrlEncoding,
  isBase64,
  isDecodableFragmentParamString,
  isDecodablePrefixedQueryString,
  isDecodableQueryString,
  isJsonString,
  isJwt,
  isRuntimePlaceholder,
  isUrl,
  looksLikeStructuredPayload,
  tryParseJsonStringPayload,
  urlDecode,
});

/**
 * 判断一个 URL 是否应作为业务 scheme/CMD 暴露。
 * 普通 HTTP(S) 资源或落地页仍可被解析，但不会进入自动 scheme 列表。
 */
export function isActionableSchemeUrl(value: string, depth = 0): boolean {
  return isActionableSchemeUrlWithOptions(value, createSchemeExposureOptions(), depth);
}

/**
 * 判断字符串是否值得在编辑器/列表里作为 scheme 暴露。
 */
export function shouldExposeSchemeValue(str: string): boolean {
  return shouldExposeSchemeValueWithOptions(str, createSchemeExposureOptions());
}

const createSchemeLayerEncodingOptions = (): SchemeLayerEncodingOptions => ({
  createRawParamOptions,
  decodeLayersForValue: value => deepDecodeScheme(value).layers,
  getFragmentParamSource,
  parseLogFieldParamString,
  urlEncode,
});

const createParamDecodeStagesOptions = () => ({
  decodeKey: decodeQueryComponent,
  decodeValue: decodeQueryValueComponent,
  decodeNestedValue: decodeNestedParamValue,
  getFragmentParamSource,
  getPrefixedQueryString,
  parseLogFieldParamString,
  tryParseJsonWithMeta,
  urlEncode,
});

/**
 * 解析 URL，提取参数
 */
export function parseUrl(urlString: string): SchemeDecodeResult['schemeInfo'] | null {
  return parseSchemeUrlInfo(urlString, {
    rawParamOptions: createRawParamOptions(),
    getFragmentParamSource,
  });
}

const tryParseJsonStringPayload = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return typeof parsed === 'string' && looksLikeStructuredPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const decodeStructuredValue = (
  value: StructuredValue,
  maxDepth: number,
  state?: SchemeStructuredDecodeState,
  path: string = '$'
): StructuredValue => {
  if (maxDepth <= 0) return value;

  if (typeof value === 'string') {
    if (detectSchemeType(value) === 'plain') return value;
    if (shouldSkipSchemeStructuredStringDecode(value, path, state)) return value;
    return decodeNestedParamValue(value, maxDepth - 1);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => decodeStructuredValue(item, maxDepth, state, `${path}[${index}]`));
  }

  if (value && typeof value === 'object') {
    const result: { [key: string]: StructuredValue } = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = decodeStructuredValue(item, maxDepth, state, `${path}${formatPlaceholderPathSegment(key)}`);
    }
    return result;
  }

  return value;
};

const parseQueryStringDeep = (queryString: string, maxDepth: number): StructuredValue | null => {
  const logFieldParam = parseLogFieldParamString(queryString);
  if (logFieldParam) {
    return {
      [logFieldParam.key]: decodeNestedParamValue(logFieldParam.value, maxDepth - 1),
    };
  }

  const source = normalizeQueryString(stripQueryPrefix(queryString));
  if (source && isDecodableQueryString(source)) {
    return parseQueryPairsDeep(source, maxDepth);
  }

  const prefixedQueryString = getPrefixedQueryString(queryString);
  if (prefixedQueryString) {
    return parseQueryPairsDeep(prefixedQueryString.queryString, maxDepth);
  }

  const fragmentParamSource = getFragmentParamSource(queryString);
  if (!fragmentParamSource || !isDecodableQueryString(fragmentParamSource)) return null;

  return parseQueryPairsDeep(fragmentParamSource, maxDepth);
};

const parseUrlQueryStringDeep = (queryString: string, maxDepth: number): StructuredValue | null => {
  const source = normalizeQueryString(stripQueryPrefix(queryString));
  if (!source || !QUERY_PAIR_START_RE.test(source)) return null;

  return parseQueryPairsDeep(source, maxDepth);
};

const parseFragmentValueDeep = (value: string, maxDepth: number): StructuredValue | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('#') && !trimmed.startsWith('/') && !trimmed.startsWith('?')) {
    return null;
  }

  const fragmentParamSource = getFragmentParamSource(trimmed);
  return fragmentParamSource ? parseUrlQueryStringDeep(fragmentParamSource, maxDepth) : null;
};

const parseQueryPairsDeep = (queryString: string, maxDepth: number): StructuredValue => {
  const singleRawStructuredParam = getSingleRawStructuredParam(queryString, createRawParamOptions());
  if (singleRawStructuredParam) {
    return {
      [singleRawStructuredParam.key]: decodeNestedParamValue(singleRawStructuredParam.value, maxDepth - 1),
    };
  }

  const singleRawUrlParam = getSingleRawUrlParam(queryString, createRawParamOptions());
  if (singleRawUrlParam) {
    return {
      [singleRawUrlParam.key]: decodeNestedParamValue(singleRawUrlParam.value, maxDepth - 1),
    };
  }

  const result: StructuredQueryParamContainer = {};
  splitQueryPairs(queryString).forEach(pair => {
    const equalIndex = pair.indexOf('=');
    if (equalIndex <= 0) return;

    const key = decodeQueryComponent(pair.slice(0, equalIndex));
    const value = decodeQueryValueComponent(pair.slice(equalIndex + 1));
    if (!key) return;

    assignQueryParam(result, key, decodeNestedParamValue(value, maxDepth - 1));
  });
  return result as StructuredValue;
};

const mergeUrlDecodedParams = (
  queryParams: StructuredValue | null,
  hashParams: StructuredValue | null
): StructuredValue | null => {
  if (queryParams && hashParams && !Array.isArray(queryParams) && typeof queryParams === 'object') {
    return {
      ...queryParams,
      _hash: hashParams,
    } as StructuredValue;
  }

  return queryParams || hashParams;
};

const parseUrlParamsDeep = (urlString: string, maxDepth: number): StructuredValue | null => {
  try {
    const url = createUrl(urlString);
    const queryParams = url.search ? parseUrlQueryStringDeep(url.search, maxDepth) : null;
    const fragmentParamSource = getFragmentParamSource(url.hash);
    const hashParams = fragmentParamSource ? parseUrlQueryStringDeep(fragmentParamSource, maxDepth) : null;

    return mergeUrlDecodedParams(queryParams, hashParams);
  } catch {
    return null;
  }
};

const decodeNestedParamValue = (value: string, maxDepth: number): StructuredValue => {
  if (maxDepth <= 0) return value;

  const jsonValue = tryParseJson(value);
  if (jsonValue !== null) {
    return decodeStructuredValue(jsonValue, maxDepth - 1);
  }

  const jsonStringPayload = tryParseJsonStringPayload(value);
  if (jsonStringPayload !== null) {
    return decodeNestedParamValue(jsonStringPayload, maxDepth);
  }

  const fragmentValue = parseFragmentValueDeep(value, maxDepth - 1);
  if (fragmentValue !== null) {
    return fragmentValue;
  }

  const base64Value = decodeBase64StructuredParam(value, maxDepth - 1);
  if (base64Value !== null) {
    return base64Value;
  }

  const nested = deepDecodeScheme(value, maxDepth);
  if (nested.isJson) {
    const parsed = tryParseJson(nested.decoded);
    return parsed === null ? nested.decoded : decodeStructuredValue(parsed, maxDepth - 1);
  }

  return nested.layers.length > 0 ? nested.decoded : value;
};

const decodeBase64StructuredParam = (value: string, maxDepth: number): StructuredValue | null => {
  const decoded = base64Decode(value);
  if (decoded === value || !looksLikeStructuredPayload(decoded)) return null;

  return decodeNestedParamValue(decoded, maxDepth);
};

// ============ 递归解码 ============

/**
 * 递归解码 scheme 字符串，直到无法继续解码
 */
export function deepDecodeScheme(input: string, maxDepth: number = DEFAULT_SCHEME_DECODE_MAX_DEPTH): SchemeDecodeResult {
  const layers: DecodeLayer[] = [];
  let current = input;
  let depth = 0;
  let schemeInfo: SchemeDecodeResult['schemeInfo'];
  let placeholders: SchemePlaceholder[] = [];
  let warnings: SchemeDecodeWarning[] | undefined;
  let paramStages: SchemeParamDecodeStage[] = [];

  while (depth < maxDepth) {
    const jsonStringPayload = tryParseJsonStringPayload(current);
    if (jsonStringPayload !== null) {
      layers.push({
        type: 'json',
        before: current,
        after: jsonStringPayload,
        description: 'JSON 字符串字面量解析',
      });
      current = jsonStringPayload;
      depth++;
      continue;
    }

    const escapedSlashPayload = tryNormalizeJsonEscapedSlashPayload(current, looksLikeStructuredPayload);
    if (escapedSlashPayload !== null) {
      layers.push({
        type: 'json-escaped-slash',
        before: current,
        after: escapedSlashPayload,
        description: 'JSON 斜杠转义还原',
      });
      current = escapedSlashPayload;
      depth++;
      continue;
    }

    const unicodeAsciiPayload = tryNormalizeJsonUnicodeAsciiPayload(current, looksLikeStructuredPayload);
    if (unicodeAsciiPayload !== null) {
      layers.push({
        type: 'json-unicode-ascii',
        before: current,
        after: unicodeAsciiPayload,
        description: 'JSON Unicode ASCII 转义还原',
        reversible: false,
      });
      current = unicodeAsciiPayload;
      depth++;
      continue;
    }

    const type = detectSchemeType(current);
    
    if (type === 'plain' || type === 'json') {
      break;
    }

    const before = current;

    switch (type) {
      case 'url': {
        // 解析 URL，提取 scheme 信息
        const urlInfo = parseUrl(current);
        if (urlInfo) {
          schemeInfo = urlInfo;
          
          // 如果有参数，将 query/hash 参数按 CMD 习惯逐项递归展开
          const decodedParams = parseUrlParamsDeep(current, maxDepth - depth);
          if (decodedParams) {
            const decodedText = JSON.stringify(decodedParams, null, 2);
            paramStages = buildUrlParamDecodeStages(current, maxDepth - depth, createParamDecodeStagesOptions());
            layers.push({
              type: 'url',
              before,
              after: decodedText,
              description: 'URL 参数递归解析',
            });
            current = decodedText;
          }
        }
        // URL 解析完成后停止；参数值已在 parseUrlParamsDeep 中递归处理
        depth = maxDepth;
        break;
      }

      case 'query-string': {
        const decodedParams = parseQueryStringDeep(current, maxDepth - depth);
        if (decodedParams) {
          const decodedText = JSON.stringify(decodedParams, null, 2);
          paramStages = buildQueryStringParamDecodeStages(current, maxDepth - depth, createParamDecodeStagesOptions());
          layers.push({
            type: 'query-string',
            before,
            after: decodedText,
            description: isDecodableLogFieldParamString(before)
              ? '日志字段 CMD 递归解析'
              : isDecodablePrefixedQueryString(before)
                ? '日志前缀 CMD 参数递归解析'
                : 'CMD 参数递归解析',
          });
          current = decodedText;
        } else {
          depth = maxDepth;
        }
        break;
      }
      
      case 'url-encoded': {
        const decoded = urlDecode(current);
        if (decoded !== current) {
          layers.push({
            type: 'url-encoded',
            before,
            after: decoded,
            description: 'URL Decode',
          });
          current = decoded;
        } else {
          depth = maxDepth;
        }
        break;
      }
      
      case 'base64': {
        const decodedResult = decodeBase64WithMeta(current);
        if (decodedResult && decodedResult.decoded !== current && decodedResult.decoded.length > 0) {
          layers.push({
            type: 'base64',
            before,
            after: decodedResult.decoded,
            description: decodedResult.reversible ? 'Base64 Decode' : 'Base64 JSON 片段解析',
            reversible: decodedResult.reversible,
          });
          current = decodedResult.decoded;
        } else {
          depth = maxDepth;
        }
        break;
      }
      
      case 'jwt': {
        const decoded = decodeJwt(current);
        if (decoded) {
          layers.push({
            type: 'jwt',
            before,
            after: JSON.stringify(decoded.payload, null, 2),
            description: 'JWT Decode (Payload)',
            reversible: false,
          });
          current = JSON.stringify(decoded.payload, null, 2);
        } else {
          depth = maxDepth;
        }
        break;
      }
    }

    depth++;
  }

  // 尝试解析最终结果为 JSON
  let isJson = false;
  let finalDecoded = current;
  
  if (isJsonString(current)) {
    isJson = true;
    try {
      const parsed = JSON.parse(current) as StructuredValue;
      // 独立 Scheme 面板也可能直接粘贴整段 response，这里复用参数递归解析能力展开内部 CMD/Scheme。
      const structuredState = createSchemeStructuredDecodeState();
      const decodedParsed = decodeStructuredValue(parsed, maxDepth, structuredState);
      finalDecoded = JSON.stringify(decodedParsed, null, 2);
      placeholders = collectRuntimePlaceholders(decodedParsed);
      warnings = buildSchemeStructuredDecodeWarnings(structuredState);
    } catch {
      // 保持原样
    }
  } else if (isRuntimePlaceholder(current)) {
    placeholders = [{
      path: '$',
      value: current.trim(),
      description: getRuntimePlaceholderDescription(current),
    }];
  }

  return {
    original: input,
    decoded: finalDecoded,
    layers,
    isJson,
    placeholders,
    warnings,
    paramStages,
    schemeInfo,
  };
}

export function encodeWithLayers(content: string, layers: DecodeLayer[]): string {
  return encodeWithSchemeLayers(
    content,
    layers,
    getPrefixedQueryString,
    createSchemeLayerEncodingOptions()
  );
}
