import { deepDecodeScheme, type SchemeDecodeResult } from '../utils/schemeUtils';

interface SchemeDecodeWorkerRequest {
  id: number;
  input: string;
}

interface SchemeDecodeWorkerResponse {
  id: number;
  result?: SchemeDecodeResult;
  error?: string;
}

self.onmessage = (event: MessageEvent<SchemeDecodeWorkerRequest>) => {
  const { id, input } = event.data;

  try {
    const response: SchemeDecodeWorkerResponse = {
      id,
      result: deepDecodeScheme(input),
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
