import { describe, expect, it, vi } from 'vitest';
import { commitAppTemplateFillCommandResult } from './appTemplateFillCommandResult';

const createEffects = (calls: string[]) => ({
  onSetTemplateApplyQualityDelta: vi.fn((value: string) => calls.push(`delta:${value}`)),
  onSetSourceText: vi.fn((value: string) => calls.push(`source:${value}`)),
  setCurrentSourceText: vi.fn((value: string) => calls.push(`current:${value}`)),
  onUpdateActiveFileContent: vi.fn((value: string) => calls.push(`file:${value}`)),
  onShowSuccess: vi.fn((message: string) => calls.push(`success:${message}`)),
});

describe('appTemplateFillCommandResult', () => {
  it('按固定顺序写回质量 delta、SOURCE、文件内容和成功提示', () => {
    const calls: string[] = [];
    const effects = createEffects(calls);

    commitAppTemplateFillCommandResult({
      effects,
      merged: '{"merged":true}',
      shouldLoadSummary: true,
      qualityDelta: '质量变化: +1',
    });

    expect(calls).toEqual([
      'delta:质量变化: +1',
      'source:{"merged":true}',
      'current:{"merged":true}',
      'file:{"merged":true}',
      'success:占位符已回填，质量对比已更新',
    ]);
  });
});
