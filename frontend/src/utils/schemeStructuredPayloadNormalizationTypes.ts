import type { LooksLikeStructuredPayload } from './schemeEscapedPayloads';
import type { DecodeLayer } from './schemeTypes';

export type SchemeStructuredPayloadNormalizationSource =
  | 'json-string'
  | 'json-escaped-slash'
  | 'json-unicode-ascii'
  | 'json-escaped-quote'
  | 'html-json-quote';

export type SchemeStructuredPayloadDecodeLayerMeta = Pick<
  DecodeLayer,
  'type' | 'description' | 'reversible'
>;

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

export interface SchemeStructuredPayloadNormalizationRule {
  source: SchemeStructuredPayloadNormalizationSource;
  normalize: (value: string, options: SchemeStructuredPayloadNormalizationOptions) => string | null;
  layer?: SchemeStructuredPayloadDecodeLayerMeta;
  quotePayload?: boolean;
}
