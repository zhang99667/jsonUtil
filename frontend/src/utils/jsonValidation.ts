import type { ValidationResult } from '../types';
import { validateJson } from './transformations';

interface JsonValidationTask {
  promise: Promise<ValidationResult>;
  cancel: () => void;
}

interface JsonValidationOptions {
  requireContainer?: boolean;
}

const VALIDATION_WORKER_ERROR_PREFIX = 'JSON 校验失败';

export const cleanJsonInput = (value: string): string => value.replace(/[\u200B-\u200D\uFEFF]/g, '');

export const isJsonContainerCandidate = (value: string): boolean => {
  const trimmedStart = cleanJsonInput(value).trimStart();
  return trimmedStart.startsWith('{') || trimmedStart.startsWith('[');
};

export const validateJsonForEditor = (value: string, options: JsonValidationOptions = {}): ValidationResult => {
  const cleanValue = cleanJsonInput(value);
  if (!cleanValue.trim()) return { isValid: true };
  if (options.requireContainer && !isJsonContainerCandidate(cleanValue)) return { isValid: true };

  return validateJson(cleanValue);
};

export const startJsonValidation = (
  value: string,
  asyncThreshold: number,
  options: JsonValidationOptions = {}
): JsonValidationTask => {
  const cleanValue = cleanJsonInput(value);

  if (cleanValue.length < asyncThreshold) {
    return {
      promise: Promise.resolve(validateJsonForEditor(cleanValue, options)),
      cancel: () => undefined,
    };
  }

  if (options.requireContainer && !isJsonContainerCandidate(cleanValue)) {
    return {
      promise: Promise.resolve({ isValid: true }),
      cancel: () => undefined,
    };
  }

  const worker = new Worker(new URL('../workers/validation.worker.ts', import.meta.url), { type: 'module' });
  let settled = false;

  const promise = new Promise<ValidationResult>(resolve => {
    worker.onmessage = (event: MessageEvent<{
      validation: ValidationResult;
    }>) => {
      settled = true;
      worker.terminate();
      resolve(event.data.validation);
    };

    worker.onerror = (event) => {
      settled = true;
      worker.terminate();
      resolve({
        isValid: false,
        error: `${VALIDATION_WORKER_ERROR_PREFIX}: ${event.message}`,
      });
    };

    worker.postMessage({ id: 1, input: cleanValue });
  });

  return {
    promise,
    cancel: () => {
      if (!settled) {
        settled = true;
        worker.terminate();
      }
    },
  };
};
