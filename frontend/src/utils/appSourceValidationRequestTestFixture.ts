import { vi } from 'vitest';
import type { ValidationResult } from '../types';
import type { runAppSourceValidationRequest } from './appSourceValidationRequest';

type SourceValidationRequestInput = Parameters<typeof runAppSourceValidationRequest>[0];

export const validSourceValidationResult: ValidationResult = { isValid: true };
export const invalidSourceValidationResult: ValidationResult = {
  isValid: false,
  error: 'source invalid',
};

export const createSourceValidationRequestInput = (
  overrides: Partial<SourceValidationRequestInput> = {}
): SourceValidationRequestInput => ({
  input: '{"a":1}',
  requestIdRef: { current: 0 },
  onSetValidation: vi.fn(),
  ...overrides,
});

export const createResolvedValidationTask = (
  result: ValidationResult = validSourceValidationResult
) => ({
  promise: Promise.resolve(result),
  cancel: vi.fn(),
});

export const createPendingValidationTask = () => {
  let resolvePromise: (result: ValidationResult) => void = () => undefined;
  const task = {
    promise: new Promise<ValidationResult>(resolve => {
      resolvePromise = resolve;
    }),
    cancel: vi.fn(),
  };

  return { task, resolvePromise };
};
