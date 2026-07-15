import { describe, expect, it } from 'vitest';
import { TransformMode } from '../types';
import { buildAppSmartSuggestionSchemePanelPlan } from './appSmartSuggestionSchemePlan';

describe('buildAppSmartSuggestionSchemePanelPlan', () => {
  it('SOURCE 为空时跳过并保留下一模式信息', () => {
    expect(buildAppSmartSuggestionSchemePanelPlan({
      eventName: 'SMART_SUGGESTION_SCHEME_PANEL',
      nextMode: TransformMode.DEEP_FORMAT,
      sourceText: '   ',
    })).toEqual({
      eventName: 'SMART_SUGGESTION_SCHEME_PANEL',
      status: 'skipped',
      nextMode: TransformMode.DEEP_FORMAT,
      effects: [],
      errorMessage: 'SOURCE 为空，暂无可解析内容',
    });
  });

  it('SOURCE 有内容时裁剪文本并打开 Scheme 面板', () => {
    expect(buildAppSmartSuggestionSchemePanelPlan({
      eventName: 'SMART_SUGGESTION_SCHEME_PANEL',
      nextMode: null,
      sourceText: '  sampleapp://v1/open  ',
    })).toEqual({
      eventName: 'SMART_SUGGESTION_SCHEME_PANEL',
      status: 'success',
      nextMode: null,
      effects: ['open-scheme-panel', 'close-transform-report'],
      schemeInputValue: 'sampleapp://v1/open',
      successMessage: '已填入 Scheme 解析',
    });
  });
});
