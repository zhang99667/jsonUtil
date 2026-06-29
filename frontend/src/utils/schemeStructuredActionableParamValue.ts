import {
  tryNormalizeHtmlJsonQuotePayload,
  tryNormalizeJsonEscapedQuotePayload,
} from './schemeJsonPayloads';
import {
  tryNormalizeJsonEscapedSlashPayload,
  tryNormalizeJsonUnicodeAsciiPayload,
} from './schemeEscapedPayloads';

export interface SchemeStructuredActionableParamValueOptions {
  base64Decode: (value: string) => string;
  hasUrlEncoding: (value: string) => boolean;
  isActionableUrl: (value: string, depth: number) => boolean;
  isBase64: (value: string) => boolean;
  isDecodableFragmentParamString: (value: string) => boolean;
  isDecodablePrefixedQueryString: (value: string) => boolean;
  isDecodableQueryString: (value: string) => boolean;
  isJsonString: (value: string) => boolean;
  isJwt: (value: string) => boolean;
  isRuntimePlaceholder: (value: string) => boolean;
  isUrl: (value: string) => boolean;
  looksLikeStructuredPayload: (value: string) => boolean;
  maxDepth: number;
  shouldExposeNormalizedValue: (value: string, depth: number) => boolean;
  tryParseJsonStringPayload: (value: string) => string | null;
  urlDecode: (value: string) => string;
}

export const isStructuredActionableParamValue = (
  value: string,
  depth: number,
  options: SchemeStructuredActionableParamValueOptions
): boolean => {
  if (depth > options.maxDepth) return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  const jsonStringPayload = options.tryParseJsonStringPayload(trimmed);
  if (jsonStringPayload !== null) {
    return options.shouldExposeNormalizedValue(jsonStringPayload, depth + 1);
  }

  const escapedSlashPayload = tryNormalizeJsonEscapedSlashPayload(trimmed, options.looksLikeStructuredPayload);
  if (escapedSlashPayload !== null) {
    return options.shouldExposeNormalizedValue(escapedSlashPayload, depth + 1);
  }

  const unicodeAsciiPayload = tryNormalizeJsonUnicodeAsciiPayload(trimmed, options.looksLikeStructuredPayload);
  if (unicodeAsciiPayload !== null) {
    return options.shouldExposeNormalizedValue(unicodeAsciiPayload, depth + 1);
  }

  const escapedQuotePayload = tryNormalizeJsonEscapedQuotePayload(trimmed);
  if (escapedQuotePayload !== null) {
    return options.shouldExposeNormalizedValue(escapedQuotePayload, depth + 1);
  }

  const htmlJsonPayload = tryNormalizeHtmlJsonQuotePayload(trimmed);
  if (htmlJsonPayload !== null) {
    return options.shouldExposeNormalizedValue(htmlJsonPayload, depth + 1);
  }

  if (options.isUrl(trimmed)) return options.isActionableUrl(trimmed, depth + 1);
  if (
    options.isRuntimePlaceholder(trimmed) ||
    options.isJsonString(trimmed) ||
    options.isJwt(trimmed) ||
    options.isDecodableFragmentParamString(trimmed) ||
    options.isDecodableQueryString(trimmed) ||
    options.isDecodablePrefixedQueryString(trimmed)
  ) {
    return true;
  }

  if (options.hasUrlEncoding(trimmed)) {
    const decoded = options.urlDecode(trimmed);
    return decoded !== trimmed && isStructuredActionableParamValue(decoded, depth + 1, options);
  }

  if (options.isBase64(trimmed)) {
    const decoded = options.base64Decode(trimmed);
    return decoded !== trimmed && options.shouldExposeNormalizedValue(decoded, depth + 1);
  }

  return false;
};
