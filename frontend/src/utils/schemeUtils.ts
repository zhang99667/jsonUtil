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
  createSchemeUrlContext,
  isUrl,
  normalizeJsonUrlEscapes,
} from './schemeUrlShapes';
import { looksLikeQueryString } from './schemeQuerySyntax';
import {
  getSchemePrefixedQueryString,
  isDecodableSchemePrefixedQueryString,
  isDecodableSchemeQueryString,
  hasUrlEncoding,
  isSchemeQueryStringFormat,
  type SchemeQueryDetectionOptions,
} from './schemeQueryDetection';
import {
  decodeQueryComponent,
  decodeQueryValueComponent as decodeSchemeQueryValueComponent,
  urlDecode,
  urlEncode,
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
  tryNormalizeHtmlJsonQuotePayload,
  tryParseJson,
  tryParseJsonStringLiteral,
  tryParseJsonWithMeta,
} from './schemeJsonPayloads';
import { getFirstSchemeStructuredPayloadNormalization } from './schemeStructuredPayloadNormalization';
import {
  buildSchemeStructuredDecodeWarnings,
  createSchemeStructuredDecodeState,
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
import {
  parseSchemeUrlInfo,
  parseSchemeUrlInfoFromContext,
} from './schemeUrlInfo';
import {
  buildQueryStringParamDecodeStages,
  buildUrlParamDecodeStages,
} from './schemeParamDecodeStages';
import {
  DEFAULT_SCHEME_DECODE_MAX_DEPTH,
  type DecodeLayer,
  type SchemeDecodeResult,
  type SchemeDisplayHeaderRecord,
  type SchemeDecodeWarning,
  type SchemeParamDecodeStage,
  type SchemePlaceholder,
  type SchemeType,
} from './schemeTypes';
import {
  addSchemeDisplayProjectionHeader,
  buildSchemeDisplayProjection,
  createSchemeDecodeDisplayContext,
  type SchemeDecodeDisplayContext,
} from './schemeDisplayProjection';
import { prepareSchemeDisplayEncoding } from './schemeDisplayEncoding';
import { createSchemeNestedDecoder } from './schemeNestedDecoding';
import { isJwt } from './schemeJwt';
import { tryParseJsonValue } from './jsonValueGuards';

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
  urlEncode,
};

export {
  hasUrlEncoding,
  isJwt,
  isSchemeQueryStringFormat as isQueryStringFormat,
  isUrl,
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
  decodeNestedParamValue: value => (
    nestedDecoder.decodeNestedParamValue(value, DEFAULT_SCHEME_DECODE_MAX_DEPTH)
  ),
});

const decodeBase64WithMeta = (input: string) => (
  decodeSchemeBase64WithMeta(input, createSchemeBase64DecodeOptions())
);

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
  getFirstSchemeStructuredPayloadNormalization(value, { looksLikeStructuredPayload }) !== null ||
  hasUrlEncoding(value) ||
  isUrl(value) ||
  isJwt(value) ||
  isBase64(value) ||
  isJsonString(value) ||
  isStructuredBase64Value(value)
);

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

export function detectSchemeType(str: string): SchemeType {
  if (!str || typeof str !== 'string') return 'plain';

  const trimmed = str.trim();
  const normalizedPayload = getFirstSchemeStructuredPayloadNormalization(trimmed, {
    looksLikeStructuredPayload,
    tryParseJsonStringPayload,
  });
  if (normalizedPayload !== null) {
    return detectSchemeType(normalizedPayload.value);
  }

  // 先识别结构化内容和明确协议，再判断宽松编码，避免 URL 编码或 Base64 抢先误判。
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

export function hasScheme(str: string): boolean {
  return shouldExposeSchemeValue(str);
}

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
  decodeLayersForValue: value => (
    deepDecodeSchemeInternal(value, DEFAULT_SCHEME_DECODE_MAX_DEPTH).layers
  ),
  getFragmentParamSource,
  parseLogFieldParamString,
  urlEncode,
});

const createParamDecodeStagesOptions = () => ({
  decodeKey: decodeQueryComponent,
  decodeValue: decodeQueryValueComponent,
  decodeNestedValue: nestedDecoder.decodeNestedParamValue,
  getFragmentParamSource,
  getPrefixedQueryString,
  parseLogFieldParamString,
  tryParseJsonWithMeta,
  urlEncode,
});

export function parseUrl(urlString: string): SchemeDecodeResult['schemeInfo'] | null {
  return parseSchemeUrlInfo(urlString, {
    rawParamOptions: createRawParamOptions(),
    getFragmentParamSource,
  });
}

const tryParseJsonStringPayload = (value: string): string | null => {
  const parsed = tryParseJsonStringLiteral(value);
  return parsed !== null && looksLikeStructuredPayload(parsed) ? parsed : null;
};

const nestedDecoder = createSchemeNestedDecoder({
  base64Decode,
  createRawParamOptions,
  decodeQueryComponent,
  decodeQueryValueComponent,
  decodeScheme: deepDecodeSchemeInternal,
  detectSchemeType,
  getFragmentParamSource,
  getPrefixedQueryString,
  isDecodableQueryString,
  looksLikeStructuredPayload,
  parseLogFieldParamString,
  tryParseJsonStringPayload,
});

function deepDecodeSchemeInternal(
  input: string,
  maxDepth: number,
  context?: SchemeDecodeDisplayContext,
): SchemeDecodeResult {
  const layers: DecodeLayer[] = [];
  let current = input;
  let depth = 0;
  let schemeInfo: SchemeDecodeResult['schemeInfo'];
  let placeholders: SchemePlaceholder[] = [];
  let warnings: SchemeDecodeWarning[] | undefined;
  let paramStages: SchemeParamDecodeStage[] = [];

  while (depth < maxDepth) {
    const normalizedPayload = getFirstSchemeStructuredPayloadNormalization(current, {
      includeQuotePayloads: false,
      looksLikeStructuredPayload,
      tryParseJsonStringPayload,
    });
    if (normalizedPayload?.layer) {
      const layer: DecodeLayer = {
        type: normalizedPayload.layer.type,
        before: current,
        after: normalizedPayload.value,
        description: normalizedPayload.layer.description,
      };
      if (normalizedPayload.layer.reversible !== undefined) {
        layer.reversible = normalizedPayload.layer.reversible;
      }
      layers.push(layer);
      current = normalizedPayload.value;
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
        try {
          const urlContext = createSchemeUrlContext(current);
          schemeInfo = parseSchemeUrlInfoFromContext(urlContext, {
            rawParamOptions: createRawParamOptions(),
            getFragmentParamSource,
          });
          const decodedParams = nestedDecoder.parseUrlParamsDeep(
            urlContext,
            maxDepth - depth,
            context,
          );
          if (decodedParams) {
            const decodedText = JSON.stringify(decodedParams, null, 2);
            paramStages = buildUrlParamDecodeStages(
              urlContext,
              maxDepth - depth,
              createParamDecodeStagesOptions(),
            );
            const urlLayer: DecodeLayer = {
              type: 'url',
              before,
              after: decodedText,
              description: 'URL 参数递归解析',
            };
            layers.push(urlLayer);
            current = JSON.stringify(
              addSchemeDisplayProjectionHeader(
                decodedParams,
                current,
                layers,
                context,
                urlContext,
              ),
              null,
              2,
            );
          }
        } catch {
          // URL 形态检测与原生解析边界不一致时保持原值，不让单条异常中断整段解码。
        }
        depth = maxDepth;
        break;
      }

      case 'query-string': {
        const decodedParams = nestedDecoder.parseQueryStringDeep(
          current,
          maxDepth - depth,
          context,
        );
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
  
  const parsedJsonValue = isJsonString(current) ? tryParseJsonValue(current) : undefined;
  if (parsedJsonValue !== undefined) {
    isJson = true;
    try {
      // 独立 Scheme 面板也可能直接粘贴整段响应，这里复用参数递归解析能力展开内部 CMD/Scheme。
      const structuredState = createSchemeStructuredDecodeState();
      const decodedParsed = nestedDecoder.decodeStructuredValue(
        parsedJsonValue,
        maxDepth,
        structuredState,
        '$',
        context,
      );
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

export function deepDecodeScheme(
  input: string,
  maxDepth: number = DEFAULT_SCHEME_DECODE_MAX_DEPTH,
): SchemeDecodeResult {
  const context = createSchemeDecodeDisplayContext();
  const result = deepDecodeSchemeInternal(input, maxDepth, context);
  if (!result.isJson || context.displayHeaderEvents.length === 0) return result;

  const projection = buildSchemeDisplayProjection(result.decoded, context);
  if (!projection) {
    return deepDecodeSchemeInternal(input, maxDepth);
  }

  return {
    ...result,
    decoded: projection.businessDecoded,
    displayDecoded: projection.displayDecoded,
    displayHeaders: projection.headers,
  };
}

export function encodeWithLayers(
  content: string,
  layers: DecodeLayer[],
  displayHeaders: SchemeDisplayHeaderRecord[] = [],
  displayHeadersInContent = true,
): string {
  const result = encodeWithLayersResult(
    content,
    layers,
    displayHeaders,
    displayHeadersInContent,
  );
  return 'value' in result ? result.value : result.fallback;
}

export type SchemeLayerEncodingResult =
  | { success: true; value: string }
  | { success: false; fallback: string };

export function encodeWithLayersResult(
  content: string,
  layers: DecodeLayer[],
  displayHeaders: SchemeDisplayHeaderRecord[] = [],
  displayHeadersInContent = true,
): SchemeLayerEncodingResult {
  const encoding = displayHeaders.length > 0
    ? prepareSchemeDisplayEncoding(
        content,
        layers,
        displayHeaders,
        (value, nestedLayers) => encodeWithSchemeLayers(
          JSON.stringify(value),
          nestedLayers,
          getPrefixedQueryString,
          createSchemeLayerEncodingOptions(),
        ),
        displayHeadersInContent,
      )
    : { content, layers, safe: true };
  if (!encoding.safe) {
    return {
      success: false,
      fallback: layers[0]?.before || content,
    };
  }

  return {
    success: true,
    value: encodeWithSchemeLayers(
      encoding.content,
      encoding.layers,
      getPrefixedQueryString,
      createSchemeLayerEncodingOptions(),
    ),
  };
}
