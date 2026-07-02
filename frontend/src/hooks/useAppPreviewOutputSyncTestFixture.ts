import { vi } from 'vitest';
import { TransformMode, type ValidationResult } from '../types';
import { useAppPreviewOutputSync } from './useAppPreviewOutputSync';
import {
  resolveAppPreviewOutputSource,
  shouldValidatePreviewOutputBeforeSync,
} from '../utils/appPreviewOutputSync';

const mocks = vi.hoisted(() => ({
  setPreviewValidation: vi.fn(),
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: mocks.useCallback,
  useEffect: mocks.useEffect,
  useRef: mocks.useRef,
  useState: mocks.useState,
}));

vi.mock('../utils/appPreviewOutputSync', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appPreviewOutputSync')>(),
  resolveAppPreviewOutputSource: vi.fn(() => 'next-source'),
  shouldValidatePreviewOutputBeforeSync: vi.fn(() => true),
}));

vi.mock('../utils/jsonValidation', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/jsonValidation')>(),
  cleanJsonInput: vi.fn((value: string) => value),
  validateJsonForEditor: vi.fn(() => ({ isValid: true })),
}));

export const validResult: ValidationResult = { isValid: true };
export const invalidResult: ValidationResult = { isValid: false, error: 'preview invalid' };
export const previewSyncMocks = mocks;
export const resolveAppPreviewOutputSourceMock = resolveAppPreviewOutputSource;

export const resetPreviewOutputSyncTestFixture = () => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.useCallback.mockImplementation((callback: unknown) => callback);
  mocks.useEffect.mockImplementation(() => undefined);
  mocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
  mocks.useState.mockImplementation((initialValue: unknown) => [initialValue, mocks.setPreviewValidation]);
  vi.mocked(resolveAppPreviewOutputSource).mockReturnValue('next-source');
  vi.mocked(shouldValidatePreviewOutputBeforeSync).mockReturnValue(true);
};

export const useHookInput = (validateJsonMaybeAsync = vi.fn(async () => validResult)) => {
  const inputRef = { current: '{"a":1}' };
  const fallbackContextRef = { current: null };
  const isUpdatingFromOutput = { current: false };
  const pendingOutputValue = { current: '' };
  const onSetInput = vi.fn();
  const onUpdateActiveFileContent = vi.fn();

  const hook = useAppPreviewOutputSync({
    files: [],
    activeFileId: null,
    mode: TransformMode.FORMAT,
    inputRef,
    fallbackContextRef,
    isUpdatingFromOutput,
    pendingOutputValue,
    validateJsonMaybeAsync,
    onSetInput,
    onUpdateActiveFileContent,
  });

  return {
    ...hook,
    inputRef,
    isUpdatingFromOutput,
    onSetInput,
    onUpdateActiveFileContent,
    pendingOutputValue,
    validateJsonMaybeAsync,
  };
};
