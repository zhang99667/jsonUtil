import { scanSchemesInJson, type SchemeLocation } from '../utils/schemeScanner';

interface SchemeScanWorkerRequest {
  id: number;
  jsonString: string;
}

interface SchemeScanWorkerResponse {
  id: number;
  locations: SchemeLocation[];
  isLimited: boolean;
  limit: number;
  error?: string;
}

self.onmessage = (event: MessageEvent<SchemeScanWorkerRequest>) => {
  const { id, jsonString } = event.data;

  try {
    const result = scanSchemesInJson(jsonString);
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
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

export {};
