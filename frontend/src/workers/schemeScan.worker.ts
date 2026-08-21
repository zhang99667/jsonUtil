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
      arrayLocations: result.arrayLocations,
      isLimited: result.isLimited,
      limit: result.limit,
      isArrayLimited: result.isArrayLimited,
      arrayLimit: result.arrayLimit,
    };
    self.postMessage(response);
  } catch (error) {
    const response: SchemeScanWorkerResponse = {
      id,
      locations: [],
      arrayLocations: [],
      isLimited: false,
      limit: 0,
      isArrayLimited: false,
      arrayLimit: 0,
      error: formatUnknownError(error),
    };
    self.postMessage(response);
  }
};

export {};
