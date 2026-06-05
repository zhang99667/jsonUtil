import type { ValidationResult } from '../types';
import { validateJson } from '../utils/transformations';

interface ValidationWorkerRequest {
  id: number;
  input: string;
}

interface ValidationWorkerResponse {
  id: number;
  validation: ValidationResult;
}

self.onmessage = (event: MessageEvent<ValidationWorkerRequest>) => {
  const { id, input } = event.data;
  const response: ValidationWorkerResponse = {
    id,
    validation: validateJson(input),
  };
  self.postMessage(response);
};

export {};
