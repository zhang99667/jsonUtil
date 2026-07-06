import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showError, showSuccess } from '../utils/toast';
import { useAppSchemeEditCommand } from './useAppSchemeEditCommand';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const useSchemeEditFixture = (previewText: string) => {
  const onPreviewChange = vi.fn();
  const { handleSchemeEdit } = useAppSchemeEditCommand({
    previewText,
    onPreviewChange,
  });

  return { handleSchemeEdit, onPreviewChange };
};

describe('useAppSchemeEditCommand', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('应用 Scheme 修改后写回 PREVIEW 并提示成功', () => {
    const { handleSchemeEdit, onPreviewChange } = useSchemeEditFixture('{"data":{"url":"old"}}');

    handleSchemeEdit('$.data.url', 'new', '/data/url');

    expect(onPreviewChange).toHaveBeenCalledWith(JSON.stringify({ data: { url: 'new' } }, null, 2));
    expect(showSuccess).toHaveBeenCalledWith('Scheme 修改已应用');
    expect(showError).not.toHaveBeenCalled();
  });

  it('应用失败时保留原内容并提示错误', () => {
    const { handleSchemeEdit, onPreviewChange } = useSchemeEditFixture('{bad json');

    handleSchemeEdit('$.data.url', 'new', '/data/url');

    expect(onPreviewChange).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith(expect.stringContaining('应用修改失败'));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to apply scheme edit:', expect.any(SyntaxError));
  });
});
