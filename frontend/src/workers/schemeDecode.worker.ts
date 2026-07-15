import { formatUnknownError } from '../utils/errors';
import { deepDecodeScheme } from '../utils/schemeUtils';
import {
  buildSchemeViewerDecodeMetadata,
} from '../utils/schemeViewerDecodeMetadata';
import type {
  SchemeDecodeWorkerRequest,
  SchemeDecodeWorkerResponse,
} from '../utils/schemeViewerDecodeWorker';

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
