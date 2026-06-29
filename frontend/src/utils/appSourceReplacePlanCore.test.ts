import { describe, expect, it } from 'vitest';
import { buildSourceReplacePlan } from './appSourceReplacePlanCore';

const buildPlan = (sourceText: string, replacementText: string) => (
  buildSourceReplacePlan({
    sourceText,
    replacementText,
    isReplacementEmpty: value => !value.trim(),
    emptyMessage: '候选为空',
    sameMessage: '候选已在 SOURCE 中',
    applyMessage: '已应用候选',
  })
);

describe('appSourceReplacePlanCore', () => {
  it('候选为空时跳过并返回错误反馈', () => {
    expect(buildPlan('source', '   ')).toEqual({
      action: 'skip',
      feedback: 'error',
      message: '候选为空',
    });
  });

  it('候选与 SOURCE 相同时跳过并返回成功反馈', () => {
    expect(buildPlan('same', 'same')).toEqual({
      action: 'skip',
      feedback: 'success',
      message: '候选已在 SOURCE 中',
    });
  });

  it('SOURCE 已有内容时要求确认替换', () => {
    expect(buildPlan('source', 'next')).toEqual({
      action: 'confirm',
      pendingText: 'next',
    });
  });

  it('SOURCE 为空时直接应用候选', () => {
    expect(buildPlan('   ', 'next')).toEqual({
      action: 'apply',
      text: 'next',
      successMessage: '已应用候选',
    });
  });
});
