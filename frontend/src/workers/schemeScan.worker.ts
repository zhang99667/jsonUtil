import { findSchemesInJson, type SchemeLocation } from '../utils/schemeUtils';

interface SchemeScanWorkerRequest {
  id: number;
  jsonString: string;
}

interface SchemeScanWorkerResponse {
  id: number;
  locations: SchemeLocation[];
  error?: string;
}

self.onmessage = (event: MessageEvent<SchemeScanWorkerRequest>) => {
  const { id, jsonString } = event.data;

  try {
    const response: SchemeScanWorkerResponse = {
      id,
      locations: findSchemesInJson(jsonString),
    };
    self.postMessage(response);
  } catch (error) {
    const response: SchemeScanWorkerResponse = {
      id,
      locations: [],
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

export {};
