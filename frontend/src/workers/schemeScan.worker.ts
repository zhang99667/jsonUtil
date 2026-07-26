import { formatUnknownError } from '../utils/errors';
import { scanSchemesInJson } from '../utils/schemeScanner';
import type {
  SchemeScanWorkerRequest,
  SchemeScanWorkerResponse,
} from '../utils/schemeScanWorker';

self.onmessage = (event: MessageEvent<SchemeScanWorkerRequest>) => {
  const { id, jsonString, forcedPaths } = event.data;

  try {
    const result = scanSchemesInJson(jsonString, { forcedPaths });
    const response: SchemeScanWorkerResponse = {
      id,
      locations: result.locations,
      isLimited: result.isLimited,
      limit: result.limit,
    };
    self.postMessage(response);
  } catch (error) {
    const response: SchemeScanWorkerResponse = {
      id,
      locations: [],
      isLimited: false,
      limit: 0,
      error: formatUnknownError(error),
    };
    self.postMessage(response);
  }
};

export {};
