import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJsonValidationErrorLocation } from '../utils/jsonValidation';
import { useAppEditorValidationLocations } from './useAppEditorValidationLocations';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useMemo: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useMemo: reactMocks.useMemo,
  useState: reactMocks.useState,
}));

vi.mock('../utils/jsonValidation', () => ({
  getJsonValidationErrorLocation: vi.fn(),
}));

const createOptions = (
  overrides: Partial<Parameters<typeof useAppEditorValidationLocations>[0]> = {}
) => ({
  sourceText: '{bad',
  previewText: '{preview',
  sourceValidation: { isValid: false, error: 'source error' },
  previewValidation: { isValid: false, error: 'preview error' },
  onSetActiveEditor: vi.fn(),
  ...overrides,
});

describe('useAppEditorValidationLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
    reactMocks.useState.mockReturnValue([0, vi.fn()]);
    vi.mocked(getJsonValidationErrorLocation)
      .mockReturnValueOnce({ line: 2, column: 4 })
      .mockReturnValueOnce({ line: 3, column: 5 });
  });

  it('SOURCE 和 PREVIEW 无效时分别计算错误定位', () => {
    const result = useAppEditorValidationLocations(createOptions());

    expect(getJsonValidationErrorLocation).toHaveBeenNthCalledWith(1, '{bad', 'source error');
    expect(getJsonValidationErrorLocation).toHaveBeenNthCalledWith(2, '{preview', 'preview error');
    expect(result.sourceErrorLocation).toEqual({ line: 2, column: 4 });
    expect(result.previewErrorLocation).toEqual({ line: 3, column: 5 });
  });

  it('验证通过时返回空定位且不调用定位解析', () => {
    const result = useAppEditorValidationLocations(createOptions({
      sourceValidation: { isValid: true },
      previewValidation: { isValid: true },
    }));

    expect(getJsonValidationErrorLocation).not.toHaveBeenCalled();
    expect(result.sourceErrorLocation).toBeNull();
    expect(result.previewErrorLocation).toBeNull();
  });

  it('没有 SOURCE 错误定位时状态栏定位不做任何操作', () => {
    vi.mocked(getJsonValidationErrorLocation)
      .mockReset()
      .mockReturnValue(null);
    const onSetActiveEditor = vi.fn();
    const setSourceErrorLocateSignal = vi.fn();
    reactMocks.useState.mockReturnValue([0, setSourceErrorLocateSignal]);
    const result = useAppEditorValidationLocations(createOptions({ onSetActiveEditor }));

    result.handleLocateSourceErrorFromStatus();

    expect(onSetActiveEditor).not.toHaveBeenCalled();
    expect(setSourceErrorLocateSignal).not.toHaveBeenCalled();
  });

  it('有 SOURCE 错误定位时聚焦 SOURCE 并递增定位信号', () => {
    const onSetActiveEditor = vi.fn();
    const setSourceErrorLocateSignal = vi.fn();
    reactMocks.useState.mockReturnValue([7, setSourceErrorLocateSignal]);
    const result = useAppEditorValidationLocations(createOptions({ onSetActiveEditor }));

    result.handleLocateSourceErrorFromStatus();

    expect(result.sourceErrorLocateSignal).toBe(7);
    expect(onSetActiveEditor).toHaveBeenCalledWith('SOURCE');
    const updater = setSourceErrorLocateSignal.mock.calls[0][0] as (signal: number) => number;
    expect(updater(7)).toBe(8);
  });
});
