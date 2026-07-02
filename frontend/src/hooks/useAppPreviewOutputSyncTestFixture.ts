import { vi } from 'vitest';
import { TransformMode, type ValidationResult } from '../types';
import { useAppPreviewOutputSync } from './useAppPreviewOutputSync';
import { executeAppPreviewOutputSync } from '../utils/appPreviewOutputSyncRunner';
import { validateJsonForEditor } from '../utils/jsonValidation';

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

vi.mock('../utils/appPreviewOutputSyncRunner', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appPreviewOutputSyncRunner')>(),
  executeAppPreviewOutputSync: vi.fn(async () => ({
    status: 'synced',
    nextSource: 'next-source',
  })),
}));

vi.mock('../utils/jsonValidation', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/jsonValidation')>(),
  cleanJsonInput: vi.fn((value: string) => value),
  validateJsonForEditor: vi.fn(() => ({ isValid: true })),
}));

export const validResult: ValidationResult = { isValid: true };
export const invalidResult: ValidationResult = { isValid: false, error: 'preview invalid' };
export const previewSyncMocks = mocks;
export const executeAppPreviewOutputSyncMock = executeAppPreviewOutputSync;
export const validateJsonForEditorMock = validateJsonForEditor;

export const resetPreviewOutputSyncTestFixture = () => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.useCallback.mockImplementation((callback: unknown) => callback);
  mocks.useEffect.mockImplementation((effect: () => unknown) => {
    effect();
  });
  mocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
  mocks.useState.mockImplementation((initialValue: unknown) => [initialValue, mocks.setPreviewValidation]);
  vi.mocked(executeAppPreviewOutputSync).mockResolvedValue({
    status: 'synced',
    nextSource: 'next-source',
  });
};

export const useHookInput = (
  validateJsonMaybeAsync = vi.fn(async () => validResult),
  previewText = ''
) => {
  const inputRef = { current: '{"a":1}' };
  const fallbackContextRef = { current: null };
  const isUpdatingFromOutput = { current: false };
  const pendingOutputValue = { current: '' };
  const onSetInput = vi.fn();
  const onUpdateActiveFileContent = vi.fn();

  const hook = useAppPreviewOutputSync({
    previewText,
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
