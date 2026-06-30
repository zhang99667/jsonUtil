import { describe, expect, it, vi } from 'vitest';
import { getStatusBarSourceValidationAction } from './statusBarSourceValidationAction';

describe('statusBarSourceValidationAction', () => {
  it('SOURCE JSON 无效且有定位回调时优先定位错误', () => {
    const onLocateSourceError = vi.fn();
    const onOpenSourceSchemeInput = vi.fn();
    const action = getStatusBarSourceValidationAction({
      sourceValidation: { isValid: false, error: 'Unexpected token' },
      sourceValidationLocation: { line: 2, column: 8 },
      sourceStandaloneDeepFormatKind: 'scheme',
      onLocateSourceError,
      onOpenSourceSchemeInput,
    });

    expect(action).toMatchObject({ type: 'locate' });
    action?.onClick();
    expect(onLocateSourceError).toHaveBeenCalledTimes(1);
    expect(onOpenSourceSchemeInput).not.toHaveBeenCalled();
  });

  it('独立可解析的 Scheme 输入有回调时打开 Scheme 面板', () => {
    const onOpenSourceSchemeInput = vi.fn();
    const action = getStatusBarSourceValidationAction({
      sourceValidation: { isValid: true },
      sourceValidationLocation: null,
      sourceStandaloneDeepFormatKind: 'url-encoded-scheme',
      onOpenSourceSchemeInput,
    });

    expect(action).toMatchObject({ type: 'openScheme' });
    action?.onClick();
    expect(onOpenSourceSchemeInput).toHaveBeenCalledTimes(1);
  });

  it('没有可执行入口时不生成动作', () => {
    expect(getStatusBarSourceValidationAction({
      sourceValidation: { isValid: true },
      sourceValidationLocation: null,
      sourceStandaloneDeepFormatKind: null,
    })).toBeNull();

    expect(getStatusBarSourceValidationAction({
      sourceValidation: { isValid: false, error: 'Unexpected token' },
      sourceValidationLocation: { line: 1, column: 1 },
      sourceStandaloneDeepFormatKind: null,
    })).toBeNull();
  });
});
