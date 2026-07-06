import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAppSchemeEditCommand } from './appSchemeEditCommandRunner';
import { showError, showSuccess } from './toast';

vi.mock('./toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

describe('appSchemeEditCommandRunner', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('应用 Scheme 修改后写回 PREVIEW 并提示成功', () => {
    const onPreviewChange = vi.fn();

    runAppSchemeEditCommand({
      previewText: '{"data":{"url":"old"}}',
      jsonPath: '$.data.url',
      newValue: 'new',
      pointer: '/data/url',
      onPreviewChange,
    });

    expect(onPreviewChange).toHaveBeenCalledWith(JSON.stringify({ data: { url: 'new' } }, null, 2));
    expect(showSuccess).toHaveBeenCalledWith('Scheme 修改已应用');
    expect(showError).not.toHaveBeenCalled();
  });

  it('应用失败时保留原内容并提示错误', () => {
    const onPreviewChange = vi.fn();

    runAppSchemeEditCommand({
      previewText: '{bad json',
      jsonPath: '$.data.url',
      newValue: 'new',
      pointer: '/data/url',
      onPreviewChange,
    });

    expect(onPreviewChange).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith(expect.stringContaining('应用修改失败'));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to apply scheme edit:', expect.any(SyntaxError));
  });
});
