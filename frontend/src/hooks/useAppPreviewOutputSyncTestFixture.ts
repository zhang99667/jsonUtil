import { vi } from 'vitest';
import { TransformMode } from '../types';
import { useAppPreviewOutputSync } from './useAppPreviewOutputSync';
import { executeAppPreviewOutputSync } from '../utils/appPreviewOutputSyncRunner';
import {
  type ValidateJsonMaybeAsync,
  validateJsonForEditor,
} from '../utils/jsonValidation';
import { validResult } from './useAppPreviewOutputSyncTestData';

const mocks = vi.hoisted(() => ({
  setPreviewValidation: vi.fn(),
  syncedResult: { status: 'synced' as const, nextSource: 'next-source' },
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
  executeAppPreviewOutputSync: vi.fn(async () => mocks.syncedResult),
}));

vi.mock('../utils/jsonValidation', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/jsonValidation')>(),
  cleanJsonInput: vi.fn((value: string) => value),
  validateJsonForEditor: vi.fn(() => ({ isValid: true })),
}));

export const previewSyncMocks = mocks;
export const executeAppPreviewOutputSyncMock = executeAppPreviewOutputSync;
export const validateJsonForEditorMock = validateJsonForEditor;

const createHookRefs = () => ({
  inputRef: { current: '{"a":1}' },
  fallbackContextRef: { current: null },
  isUpdatingFromOutput: { current: false },
  pendingOutputValue: { current: '' },
});

const createHookCallbacks = () => ({
  onSetInput: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
});

export const resetPreviewOutputSyncTestFixture = () => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.useCallback.mockImplementation((callback: unknown) => callback);
  mocks.useEffect.mockImplementation((effect: () => unknown) => effect());
  mocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
  mocks.useState.mockImplementation((initialValue: unknown) => [initialValue, mocks.setPreviewValidation]);
  vi.mocked(executeAppPreviewOutputSync).mockResolvedValue(mocks.syncedResult);
};

export const useHookInput = (
  validateJsonMaybeAsync: ValidateJsonMaybeAsync = vi.fn(async () => validResult),
  previewText = ''
) => {
  const refs = createHookRefs();
  const callbacks = createHookCallbacks();

  const hook = useAppPreviewOutputSync({
    previewText,
    files: [],
    activeFileId: null,
    mode: TransformMode.FORMAT,
    ...refs,
    validateJsonMaybeAsync,
    ...callbacks,
  });

  return {
    ...hook,
    ...refs,
    ...callbacks,
    validateJsonMaybeAsync,
  };
};
