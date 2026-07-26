import {
  extractBase64MetaInfoFromContext,
  extractSchemeCommandSummaryInfo,
  extractSchemeCommandSummaryInfoFromContext,
  type Base64MetaInfo,
  type SchemeCommandSummaryInfo,
} from './schemeMetadata';
import { parseSchemeMetadataContext } from './schemeMetadataContext';
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
): SchemeViewerDecodeMetadata => {
  if (!result.isJson) {
    return {
      base64MetaInfo: null,
      commandSummaryInfo: extractSchemeCommandSummaryInfo(
        result.decoded,
        false,
        result.schemeInfo,
        {
          includeCommandFieldRows: options.includeCommandFieldRows,
          source: result.original,
        },
      ),
    };
  }

  const context = parseSchemeMetadataContext(result.decoded, result.original);
  if (!context) {
    return {
      base64MetaInfo: null,
      commandSummaryInfo: null,
    };
  }

  return {
    base64MetaInfo: extractBase64MetaInfoFromContext(context),
    commandSummaryInfo: extractSchemeCommandSummaryInfoFromContext(
      context,
      result.schemeInfo,
      {
        includeCommandFieldRows: options.includeCommandFieldRows,
      },
    ),
  };
};
