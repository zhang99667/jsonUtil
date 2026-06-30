import { describe, expect, it, vi } from 'vitest';
import type { AppSaveExecutablePlan } from './appSaveActionPlanTypes';
import { executeAppSavePlan } from './appSavePlanExecutor';

const createEffects = () => ({
  onSaveFile: vi.fn(async (_content?: string) => true),
  onSaveSourceAs: vi.fn(async () => true),
  onSavePreviewAs: vi.fn(async () => true),
  onShowError: vi.fn(),
  onShowSuccess: vi.fn(),
  onTrackToolEvent: vi.fn(),
});

const runPlan = (plan: AppSaveExecutablePlan, effects = createEffects()) => (
  executeAppSavePlan({ plan, previewText: '{"preview":1}', effects })
);

describe('appSavePlanExecutor', () => {
  it('带错误信息的 skip 计划只提示错误并返回失败', async () => {
    const effects = createEffects();
    const result = await runPlan({
      action: 'skip',
      reason: 'preview-transforming',
      message: '预览仍在处理',
    }, effects);

    expect(result).toBe(false);
    expect(effects.onShowError).toHaveBeenCalledWith('预览仍在处理');
    expect(effects.onSaveFile).not.toHaveBeenCalled();
    expect(effects.onSavePreviewAs).not.toHaveBeenCalled();
    expect(effects.onSaveSourceAs).not.toHaveBeenCalled();
  });

  it('无错误信息的 skip 计划保持静默失败', async () => {
    const effects = createEffects();
    const result = await runPlan({
      action: 'skip',
      reason: 'preview-active-file-without-handle',
    }, effects);

    expect(result).toBe(false);
    expect(effects.onShowError).not.toHaveBeenCalled();
    expect(effects.onShowSuccess).not.toHaveBeenCalled();
  });

  it('PREVIEW 写回文件时传入预览内容', async () => {
    const effects = createEffects();
    const result = await runPlan({
      action: 'save-preview-to-file',
      successMessage: '已保存预览',
    }, effects);

    expect(result).toBe(true);
    expect(effects.onSaveFile).toHaveBeenCalledWith('{"preview":1}');
    expect(effects.onShowSuccess).toHaveBeenCalledWith('已保存预览');
  });

  it('SOURCE 写回文件时无参数调用保存副作用', async () => {
    const effects = createEffects();
    await runPlan({ action: 'save-source-to-file', successMessage: '已保存源文件' }, effects);

    expect(effects.onSaveFile).toHaveBeenCalledWith();
    expect(effects.onShowSuccess).toHaveBeenCalledWith('已保存源文件');
  });

  it('PREVIEW 另存为不额外展示成功提示', async () => {
    const effects = createEffects();
    const result = await runPlan({ action: 'save-preview-as' }, effects);

    expect(result).toBe(true);
    expect(effects.onSavePreviewAs).toHaveBeenCalledTimes(1);
    expect(effects.onShowSuccess).not.toHaveBeenCalled();
  });

  it('保存失败时不展示成功提示', async () => {
    const effects = createEffects();
    effects.onSaveFile.mockResolvedValue(false);
    const result = await runPlan({
      action: 'save-source-to-file',
      successMessage: '已保存源文件',
    }, effects);

    expect(result).toBe(false);
    expect(effects.onShowSuccess).not.toHaveBeenCalled();
  });

  it('SOURCE 另存为成功时展示计划里的成功提示', async () => {
    const effects = createEffects();
    const result = await runPlan({
      action: 'save-source-as',
      successMessage: '已另存为源文件',
    }, effects);

    expect(result).toBe(true);
    expect(effects.onSaveSourceAs).toHaveBeenCalledTimes(1);
    expect(effects.onShowSuccess).toHaveBeenCalledWith('已另存为源文件');
  });
});
