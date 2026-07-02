import type { DecodeLayer } from './schemeTypes';
import { tryNormalizeHtmlJsonQuotePayload, tryNormalizeJsonEscapedQuotePayload } from './schemeJsonPayloads';
import {
  type LooksLikeStructuredPayload,
  tryNormalizeJsonEscapedSlashPayload,
  tryNormalizeJsonUnicodeAsciiPayload,
} from './schemeEscapedPayloads';

type SchemeStructuredPayloadNormalizationSource = 'json-string' | 'json-escaped-slash' | 'json-unicode-ascii' | 'json-escaped-quote' | 'html-json-quote';

type SchemeStructuredPayloadDecodeLayerMeta = Pick<DecodeLayer, 'type' | 'description' | 'reversible'>;

export interface SchemeStructuredPayloadNormalizationOptions {
  includeQuotePayloads?: boolean;
  looksLikeStructuredPayload: LooksLikeStructuredPayload;
  tryParseJsonStringPayload?: (value: string) => string | null;
}

export interface SchemeStructuredPayloadNormalization {
  source: SchemeStructuredPayloadNormalizationSource;
  value: string;
  layer?: SchemeStructuredPayloadDecodeLayerMeta;
}

export const getFirstSchemeStructuredPayloadNormalization = (
  value: string,
  options: SchemeStructuredPayloadNormalizationOptions
): SchemeStructuredPayloadNormalization | null => {
  const trimmed = value.trim();
  const jsonStringPayload = options.tryParseJsonStringPayload?.(trimmed) ?? null;
  if (jsonStringPayload !== null) {
    return {
      source: 'json-string',
      value: jsonStringPayload,
      layer: {
        type: 'json',
        description: 'JSON 字符串字面量解析',
      },
    };
  }

  const escapedSlashPayload = tryNormalizeJsonEscapedSlashPayload(trimmed, options.looksLikeStructuredPayload);
  if (escapedSlashPayload !== null) {
    return {
      source: 'json-escaped-slash',
      value: escapedSlashPayload,
      layer: {
        type: 'json-escaped-slash',
        description: 'JSON 斜杠转义还原',
      },
    };
  }

  const unicodeAsciiPayload = tryNormalizeJsonUnicodeAsciiPayload(trimmed, options.looksLikeStructuredPayload);
  if (unicodeAsciiPayload !== null) {
    return {
      source: 'json-unicode-ascii',
      value: unicodeAsciiPayload,
      layer: {
        type: 'json-unicode-ascii',
        description: 'JSON Unicode ASCII 转义还原',
        reversible: false,
      },
    };
  }

  if (options.includeQuotePayloads === false) return null;

  const escapedQuotePayload = tryNormalizeJsonEscapedQuotePayload(trimmed);
  if (escapedQuotePayload !== null) return { source: 'json-escaped-quote', value: escapedQuotePayload };

  const htmlJsonPayload = tryNormalizeHtmlJsonQuotePayload(trimmed);
  if (htmlJsonPayload !== null) return { source: 'html-json-quote', value: htmlJsonPayload };

  return null;
};
