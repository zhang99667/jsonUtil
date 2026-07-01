import {
  extractBase64MetaInfo,
  extractSchemeCommandSummaryInfo,
  type Base64MetaInfo,
  type SchemeCommandSummaryInfo,
} from './schemeMetadata';
import type { SchemeDecodeResult } from './schemeTypes';

export interface SchemeViewerDecodeMetadata {
  base64MetaInfo: Base64MetaInfo | null;
  commandSummaryInfo: SchemeCommandSummaryInfo | null;
}

interface BuildSchemeViewerDecodeMetadataOptions {
  includeCommandFieldRows?: boolean;
}

export const createEmptySchemeDecodeResult = (original = ''): SchemeDecodeResult => ({
  original,
  decoded: '',
  layers: [],
  isJson: false,
});

export const buildSchemeViewerDecodeMetadata = (
  result: SchemeDecodeResult,
  options: BuildSchemeViewerDecodeMetadataOptions = {}
): SchemeViewerDecodeMetadata => ({
  base64MetaInfo: extractBase64MetaInfo(result.decoded, result.isJson),
  commandSummaryInfo: extractSchemeCommandSummaryInfo(
    result.decoded,
    result.isJson,
    result.schemeInfo,
    {
      includeCommandFieldRows: options.includeCommandFieldRows,
      source: result.original,
    }
  ),
});
