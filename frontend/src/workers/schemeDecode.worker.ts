import { deepDecodeScheme } from '../utils/schemeUtils';
import type { SchemeDecodeResult } from '../utils/schemeTypes';
import {
  extractBase64MetaInfo,
  extractSchemeCommandSummaryInfo,
  type Base64MetaInfo,
  type SchemeCommandSummaryInfo,
} from '../utils/schemeMetadata';

interface SchemeDecodeWorkerRequest {
  id: number;
  input: string;
}

interface SchemeDecodeWorkerResponse {
  id: number;
  result?: SchemeDecodeResult;
  metadata?: SchemeDecodeWorkerMetadata;
  error?: string;
}

interface SchemeDecodeWorkerMetadata {
  base64MetaInfo: Base64MetaInfo | null;
  commandSummaryInfo: SchemeCommandSummaryInfo | null;
}

const buildSchemeDecodeMetadata = (result: SchemeDecodeResult): SchemeDecodeWorkerMetadata => ({
  base64MetaInfo: extractBase64MetaInfo(result.decoded, result.isJson),
  commandSummaryInfo: extractSchemeCommandSummaryInfo(
    result.decoded,
    result.isJson,
    result.schemeInfo,
    { includeCommandFieldRows: false, source: result.original }
  ),
});

self.onmessage = (event: MessageEvent<SchemeDecodeWorkerRequest>) => {
  const { id, input } = event.data;

  try {
    const result = deepDecodeScheme(input);
    const response: SchemeDecodeWorkerResponse = {
      id,
      result,
      metadata: buildSchemeDecodeMetadata(result),
    };
    self.postMessage(response);
  } catch (error) {
    const response: SchemeDecodeWorkerResponse = {
      id,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

export {};
