import { formatUnknownError } from '../utils/errors';
import { deepDecodeScheme } from '../utils/schemeUtils';
import type { SchemeDecodeResult } from '../utils/schemeTypes';
import {
  buildSchemeViewerDecodeMetadata,
  type SchemeViewerDecodeMetadata,
} from '../utils/schemeViewerDecodeMetadata';

interface SchemeDecodeWorkerRequest {
  id: number;
  input: string;
}

interface SchemeDecodeWorkerResponse {
  id: number;
  result?: SchemeDecodeResult;
  metadata?: SchemeViewerDecodeMetadata;
  error?: string;
}

self.onmessage = (event: MessageEvent<SchemeDecodeWorkerRequest>) => {
  const { id, input } = event.data;

  try {
    const result = deepDecodeScheme(input);
    const response: SchemeDecodeWorkerResponse = {
      id,
      result,
      metadata: buildSchemeViewerDecodeMetadata(result, {
        includeCommandFieldRows: false,
      }),
    };
    self.postMessage(response);
  } catch (error) {
    const response: SchemeDecodeWorkerResponse = {
      id,
      error: formatUnknownError(error),
    };
    self.postMessage(response);
  }
};

export {};
