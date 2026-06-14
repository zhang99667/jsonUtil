import type { ValidationResult } from '../types';
import { validateJson } from './transformations';

interface JsonErrorLocation {
  line: number;
  column: number;
}

interface JsonValidationTask {
  promise: Promise<ValidationResult>;
  cancel: () => void;
}

interface JsonValidationOptions {
  requireContainer?: boolean;
}

const VALIDATION_WORKER_ERROR_PREFIX = 'JSON 校验失败';
const JSON_LINES_ERROR_RE = /JSON Lines 第\s*(\d+)\s*行解析错误/;
const JSON_ERROR_LINE_COLUMN_RE = /line\s+(\d+)\s+column\s+(\d+)/i;
const JSON_ERROR_POSITION_RE = /position\s+(\d+)/i;

export const cleanJsonInput = (value: string): string => value.replace(/[\u200B-\u200D\uFEFF]/g, '');

const positionToLocation = (value: string, position: number): JsonErrorLocation => {
  const safePosition = Math.max(0, Math.min(position, value.length));
  let line = 1;
  let column = 1;

  for (let index = 0; index < safePosition; index++) {
    const char = value[index];
    if (char === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
};

const getJsonLineColumnOffset = (line: string): number => {
  const offset = line.search(/\S/);
  return offset >= 0 ? offset : 0;
};

/**
 * 从浏览器/Node JSON.parse 错误文案中提取编辑器定位信息。
 * 不同运行时错误格式不同，因此同时兼容 line/column、position 与 JSON Lines 行号。
 */
export const getJsonValidationErrorLocation = (
  value: string,
  error?: string
): JsonErrorLocation | null => {
  if (!error) return null;

  const jsonLinesMatch = error.match(JSON_LINES_ERROR_RE);
  if (jsonLinesMatch) {
    const line = Number(jsonLinesMatch[1]);
    if (!Number.isFinite(line) || line < 1) return null;

    const sourceLine = value.split(/\r?\n/)[line - 1] || '';
    const columnOffset = getJsonLineColumnOffset(sourceLine);
    const nestedLineColumnMatch = error.match(JSON_ERROR_LINE_COLUMN_RE);
    if (nestedLineColumnMatch) {
      return {
        line,
        column: columnOffset + Number(nestedLineColumnMatch[2]),
      };
    }

    const nestedPositionMatch = error.match(JSON_ERROR_POSITION_RE);
    if (nestedPositionMatch) {
      const trimmedLine = sourceLine.trim();
      const location = positionToLocation(trimmedLine, Number(nestedPositionMatch[1]));
      return {
        line,
        column: columnOffset + location.column,
      };
    }

    return {
      line,
      column: columnOffset + 1,
    };
  }

  const lineColumnMatch = error.match(JSON_ERROR_LINE_COLUMN_RE);
  if (lineColumnMatch) {
    return {
      line: Number(lineColumnMatch[1]),
      column: Number(lineColumnMatch[2]),
    };
  }

  const positionMatch = error.match(JSON_ERROR_POSITION_RE);
  if (positionMatch) {
    return positionToLocation(value, Number(positionMatch[1]));
  }

  return null;
};

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
