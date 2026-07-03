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

const formattedJson = (value: unknown) => JSON.stringify(value, null, 2);

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

  it('优先按 JSON Pointer 精确写回 PREVIEW', () => {
    const { handleSchemeEdit, onPreviewChange } = useSchemeEditFixture('{"data":{"url":"old"}}');

    handleSchemeEdit('$.data.url', 'new', '/data/url');

    expect(onPreviewChange).toHaveBeenCalledWith(formattedJson({ data: { url: 'new' } }));
    expect(showSuccess).toHaveBeenCalledWith('Scheme 修改已应用');
    expect(showError).not.toHaveBeenCalled();
  });

  it('没有 pointer 时兼容旧 JSONPath 写回', () => {
    const { handleSchemeEdit, onPreviewChange } = useSchemeEditFixture('{"list":[{"url":"old"}]}');

    handleSchemeEdit('$.list[0].url', 'new');

    expect(onPreviewChange).toHaveBeenCalledWith(formattedJson({ list: [{ url: 'new' }] }));
    expect(showSuccess).toHaveBeenCalledWith('Scheme 修改已应用');
  });

  it('PREVIEW 无法解析时保留原内容并提示错误', () => {
    const { handleSchemeEdit, onPreviewChange } = useSchemeEditFixture('{bad json');

    handleSchemeEdit('$.data.url', 'new', '/data/url');

    expect(onPreviewChange).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith(expect.stringContaining('应用修改失败'));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to apply scheme edit:', expect.any(SyntaxError));
  });

  it('JSON Pointer 写入失败时不回退旧 JSONPath', () => {
    const { handleSchemeEdit, onPreviewChange } = useSchemeEditFixture('{"items":["old"]}');

    handleSchemeEdit('$.items[0]', 'new', '/items/bad');

    expect(onPreviewChange).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith(expect.stringContaining('应用修改失败：非法数组下标'));
  });
});
