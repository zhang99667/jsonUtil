import type { ValidationResult } from '../types';
import { formatUnknownError } from './errors';
import { isRecord as isUnknownRecord } from './storage';
import { validateJson } from './transformations';
export { getJsonValidationErrorLocation } from './jsonValidationErrorLocation';

interface JsonValidationTask {
  promise: Promise<ValidationResult>;
  cancel: () => void;
}

export interface JsonValidationOptions {
  requireContainer?: boolean;
  signal?: AbortSignal;
}

export type ValidateJsonMaybeAsync = (
  value: string,
  options?: JsonValidationOptions
) => Promise<ValidationResult>;

const VALIDATION_WORKER_ERROR_PREFIX = 'JSON 校验失败';
const VALIDATION_WORKER_REQUEST_ID = 1;
export const JSON_VALIDATION_WORKER_TIMEOUT_MS = 10_000;

const createValidationWorkerError = (detail: string): ValidationResult => ({
  isValid: false,
  error: `${VALIDATION_WORKER_ERROR_PREFIX}: ${detail}`,
});

const createValidationAbortError = (): DOMException => (
  new DOMException('JSON 校验已取消', 'AbortError')
);

const isValidationResult = (value: unknown): value is ValidationResult => {
  if (!isUnknownRecord(value) || typeof value.isValid !== 'boolean') return false;
  return value.error === undefined || typeof value.error === 'string';
};

export const cleanJsonInput = (value: string): string => value.replace(/[\u200B-\u200D\uFEFF]/g, '');

export const isCleanJsonInputEmpty = (cleanValue: string): boolean => cleanValue.trim().length === 0;

export const isJsonContainerCandidate = (value: string): boolean => {
  const trimmedStart = cleanJsonInput(value).trimStart();
  return trimmedStart.startsWith('{') || trimmedStart.startsWith('[');
};

export const validateJsonForEditor = (value: string, options: JsonValidationOptions = {}): ValidationResult => {
  const cleanValue = cleanJsonInput(value);
  if (isCleanJsonInputEmpty(cleanValue)) return { isValid: true };
  if (options.requireContainer && !isJsonContainerCandidate(cleanValue)) return { isValid: true };

  return validateJson(cleanValue);
};

export const startJsonValidation = (
  value: string,
  asyncThreshold: number,
  options: JsonValidationOptions = {}
): JsonValidationTask => {
  const cleanValue = cleanJsonInput(value);
  const { signal } = options;

  if (signal?.aborted) {
    return {
      promise: Promise.reject(signal.reason ?? createValidationAbortError()),
      cancel: () => undefined,
    };
  }

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

  let worker: Worker;
  try {
    worker = new Worker(new URL('../workers/validation.worker.ts', import.meta.url), { type: 'module' });
  } catch (error) {
    return {
      promise: Promise.resolve(createValidationWorkerError(formatUnknownError(error))),
      cancel: () => undefined,
    };
  }

  let settled = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let removeAbortListener = () => undefined;
  const stopWorker = (): boolean => {
    if (settled) return false;
    settled = true;
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
    removeAbortListener();
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
    return true;
  };

  let cancelValidation = () => undefined;
  const promise = new Promise<ValidationResult>((resolve, reject) => {
    const finish = (result: ValidationResult) => {
      if (stopWorker()) resolve(result);
    };

    const abortValidation = () => {
      if (stopWorker()) {
        reject(signal?.reason ?? createValidationAbortError());
      }
    };
    cancelValidation = abortValidation;

    if (signal) {
      signal.addEventListener('abort', abortValidation, { once: true });
      removeAbortListener = () => signal.removeEventListener('abort', abortValidation);
      if (signal.aborted) {
        abortValidation();
        return;
      }
    }

    worker.onmessage = (event: MessageEvent<unknown>) => {
      const response = event.data;
      if (!isUnknownRecord(response) || typeof response.id !== 'number') {
        finish(createValidationWorkerError('Worker 响应格式无效'));
        return;
      }
      if (response.id !== VALIDATION_WORKER_REQUEST_ID) {
        finish(createValidationWorkerError('Worker 响应标识不匹配'));
        return;
      }
      if (!isValidationResult(response.validation)) {
        finish(createValidationWorkerError('Worker 响应格式无效'));
        return;
      }
      finish(response.validation);
    };

    worker.onerror = (event) => {
      finish(createValidationWorkerError(event.message));
    };

    timeoutId = globalThis.setTimeout(() => {
      finish(createValidationWorkerError('Worker 响应超时'));
    }, JSON_VALIDATION_WORKER_TIMEOUT_MS);

    try {
      worker.postMessage({ id: VALIDATION_WORKER_REQUEST_ID, input: cleanValue });
    } catch (error) {
      finish(createValidationWorkerError(formatUnknownError(error)));
    }
  });

  return {
    promise,
    cancel: cancelValidation,
  };
};
