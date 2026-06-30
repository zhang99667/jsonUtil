import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const validResult: ValidationResult = { isValid: true };
const invalidResult: ValidationResult = { isValid: false, error: 'preview invalid' };

const useHookInput = (validateJsonMaybeAsync = vi.fn(async () => validResult)) => {
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

describe('useAppPreviewOutputSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.useCallback.mockImplementation((callback: unknown) => callback);
    mocks.useEffect.mockImplementation(() => undefined);
    mocks.useRef.mockImplementation((initialValue: unknown) => ({ current: initialValue }));
    mocks.useState.mockImplementation((initialValue: unknown) => [initialValue, mocks.setPreviewValidation]);
    vi.mocked(resolveAppPreviewOutputSource).mockReturnValue('next-source');
    vi.mocked(shouldValidatePreviewOutputBeforeSync).mockReturnValue(true);
  });

  it('PREVIEW 编辑先暂存，防抖后回写 SOURCE 并延迟解锁', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');

    expect(result.pendingOutputValue.current).toBe('{"a":2}');
    expect(result.isUpdatingFromOutput.current).toBe(true);
    expect(result.onSetInput).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(400);

    expect(result.validateJsonMaybeAsync).toHaveBeenCalledWith('{"a":2}');
    expect(resolveAppPreviewOutputSource).toHaveBeenCalledWith({
      previewText: '{"a":2}',
      mode: TransformMode.FORMAT,
      originalInput: '{"a":1}',
      context: null,
    });
    expect(result.onSetInput).toHaveBeenCalledWith('next-source');
    expect(result.inputRef.current).toBe('next-source');
    expect(result.onUpdateActiveFileContent).toHaveBeenCalledWith('next-source');
    expect(result.isUpdatingFromOutput.current).toBe(true);

    await vi.advanceTimersByTimeAsync(600);

    expect(result.pendingOutputValue.current).toBe('');
    expect(result.isUpdatingFromOutput.current).toBe(false);
  });

  it('格式化类 PREVIEW 校验失败时不覆盖 SOURCE', async () => {
    const result = useHookInput(vi.fn(async () => invalidResult));

    result.handleOutputChange('{bad');
    await vi.advanceTimersByTimeAsync(400);

    expect(mocks.setPreviewValidation).toHaveBeenCalledWith(invalidResult);
    expect(result.onSetInput).not.toHaveBeenCalled();
    expect(result.onUpdateActiveFileContent).not.toHaveBeenCalled();
    expect(result.pendingOutputValue.current).toBe('');
    expect(result.isUpdatingFromOutput.current).toBe(false);
  });

  it('连续编辑时只同步最后一次 PREVIEW 内容', async () => {
    const result = useHookInput();

    result.handleOutputChange('{"a":2}');
    result.handleOutputChange('{"a":3}');
    await vi.advanceTimersByTimeAsync(400);

    expect(resolveAppPreviewOutputSource).toHaveBeenCalledTimes(1);
    expect(resolveAppPreviewOutputSource).toHaveBeenCalledWith(expect.objectContaining({
      previewText: '{"a":3}',
    }));
    expect(result.onSetInput).toHaveBeenCalledTimes(1);
  });
});
