import { describe, expect, it, vi } from 'vitest';
import { runTransformReportCopyText } from './transformReportCopyActionRunner';

const createEffects = () => ({
  copyText: vi.fn(async (_text: string) => undefined),
  showSuccess: vi.fn(),
  showError: vi.fn(),
});

describe('transformReportCopyActionRunner', () => {
  it('文本为空时跳过复制副作用', async () => {
    const effects = createEffects();

    const copied = await runTransformReportCopyText({
      text: '',
      successMessage: '已复制',
      errorLogMessage: '复制失败:',
    }, effects);

    expect(copied).toBe(false);
    expect(effects.copyText).not.toHaveBeenCalled();
    expect(effects.showSuccess).not.toHaveBeenCalled();
    expect(effects.showError).not.toHaveBeenCalled();
  });

  it('复制成功时支持根据文本生成成功文案', async () => {
    const effects = createEffects();

    const copied = await runTransformReportCopyText({
      text: 'abc',
      successMessage: text => `已复制 ${text.length} 字符`,
      errorLogMessage: '复制失败:',
    }, effects);

    expect(copied).toBe(true);
    expect(effects.copyText).toHaveBeenCalledWith('abc');
    expect(effects.showSuccess).toHaveBeenCalledWith('已复制 3 字符', { duration: 2000 });
    expect(effects.showError).not.toHaveBeenCalled();
  });

  it('复制成功时透传固定文案和自定义时长', async () => {
    const effects = createEffects();

    const copied = await runTransformReportCopyText({
      text: 'value',
      successMessage: '已复制路径',
      errorLogMessage: '复制路径失败:',
      duration: 1600,
    }, effects);

    expect(copied).toBe(true);
    expect(effects.showSuccess).toHaveBeenCalledWith('已复制路径', { duration: 1600 });
  });

  it('复制失败时只触发统一错误提示入口', async () => {
    const error = new Error('blocked');
    const effects = createEffects();
    effects.copyText.mockRejectedValueOnce(error);

    const copied = await runTransformReportCopyText({
      text: 'abc',
      successMessage: '已复制',
      errorLogMessage: '复制报告失败:',
    }, effects);

    expect(copied).toBe(false);
    expect(effects.showSuccess).not.toHaveBeenCalled();
    expect(effects.showError).toHaveBeenCalledWith('复制报告失败:', error);
  });
});
