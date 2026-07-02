import { tryNormalizeHtmlJsonQuotePayload, tryNormalizeJsonEscapedQuotePayload } from './schemeJsonPayloads';
import {
  tryNormalizeJsonEscapedSlashPayload,
  tryNormalizeJsonUnicodeAsciiPayload,
} from './schemeEscapedPayloads';
import type {
  SchemeStructuredPayloadNormalization,
  SchemeStructuredPayloadNormalizationOptions,
  SchemeStructuredPayloadNormalizationRule,
} from './schemeStructuredPayloadNormalizationTypes';
export type {
  SchemeStructuredPayloadNormalization,
  SchemeStructuredPayloadNormalizationOptions,
  SchemeStructuredPayloadNormalizationSource,
} from './schemeStructuredPayloadNormalizationTypes';

const structuredPayloadNormalizationRules: SchemeStructuredPayloadNormalizationRule[] = [
  {
    source: 'json-string',
    normalize: (value, options) => options.tryParseJsonStringPayload?.(value) ?? null,
    layer: { type: 'json', description: 'JSON 字符串字面量解析' },
  },
  {
    source: 'json-escaped-slash',
    normalize: (value, options) => tryNormalizeJsonEscapedSlashPayload(value, options.looksLikeStructuredPayload),
    layer: { type: 'json-escaped-slash', description: 'JSON 斜杠转义还原' },
  },
  {
    source: 'json-unicode-ascii',
    normalize: (value, options) => tryNormalizeJsonUnicodeAsciiPayload(value, options.looksLikeStructuredPayload),
    layer: { type: 'json-unicode-ascii', description: 'JSON Unicode ASCII 转义还原', reversible: false },
  },
  { source: 'json-escaped-quote', normalize: tryNormalizeJsonEscapedQuotePayload, quotePayload: true },
  { source: 'html-json-quote', normalize: tryNormalizeHtmlJsonQuotePayload, quotePayload: true },
];

export const getFirstSchemeStructuredPayloadNormalization = (
  value: string,
  options: SchemeStructuredPayloadNormalizationOptions
): SchemeStructuredPayloadNormalization | null => {
  const trimmed = value.trim();
  for (const rule of structuredPayloadNormalizationRules) {
    if (rule.quotePayload && options.includeQuotePayloads === false) continue;

    const normalized = rule.normalize(trimmed, options);
    if (normalized !== null) {
      return rule.layer
        ? { source: rule.source, value: normalized, layer: rule.layer }
        : { source: rule.source, value: normalized };
    }
  }

  return null;
};
