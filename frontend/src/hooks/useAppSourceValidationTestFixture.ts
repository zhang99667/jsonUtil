import { afterEach, beforeEach, vi } from 'vitest';
import type { ValidationResult } from '../types';
import { runAppSourceValidationRequest } from '../utils/appSourceValidationRequest';
import { SOURCE_VALIDATION_DEBOUNCE_MS } from '../utils/appSourceValidationScheduler';
import { useAppSourceValidation } from './useAppSourceValidation';

const mocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useRef: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: mocks.useEffect,
  useRef: mocks.useRef,
}));

vi.mock('../utils/appSourceValidationRequest', () => ({
  runAppSourceValidationRequest: vi.fn(),
}));

export const setupAppSourceValidationHookTest = () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
    mocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    vi.mocked(runAppSourceValidationRequest).mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
};

export const useSourceValidationHookForTest = (
  input: string,
  onSetValidation = vi.fn()
) => {
  useAppSourceValidation({ input, onSetValidation });
  return { onSetValidation };
};

export const advanceSourceValidationDebounce = () => (
  vi.advanceTimersByTimeAsync(SOURCE_VALIDATION_DEBOUNCE_MS)
);

export const mockSourceValidationRequestIdRef = (requestIdRef: { current: number }) => {
  mocks.useRef.mockReturnValue(requestIdRef);
};

export const captureSourceValidationCleanup = () => {
  let cleanup: (() => void) | undefined;
  mocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
    const result = effect();
    cleanup = typeof result === 'function' ? result : undefined;
  });
  return () => cleanup?.();
};

export const createCancellableValidationTask = () => ({
  promise: new Promise<ValidationResult>(() => undefined),
  cancel: vi.fn(),
});

export const getRunAppSourceValidationRequestMock = () => vi.mocked(runAppSourceValidationRequest);
