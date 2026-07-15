import { describe, expect, it } from 'vitest';
import { TransformMode } from '../types';
import {
  buildAppSmartSuggestionActionPlan,
  getSmartSuggestionEventName,
} from './appSmartSuggestionActions';

describe('appSmartSuggestionActions', () => {
  it('生成稳定的埋点事件名', () => {
    expect(getSmartSuggestionEventName('deep-format-report')).toBe('SMART_SUGGESTION_DEEP_FORMAT_REPORT');
  });

  it('AI 修复动作委托给现有修复流程', () => {
    expect(buildAppSmartSuggestionActionPlan({
      actionId: 'ai-fix',
      currentMode: TransformMode.NONE,
      sourceText: '{bad',
    })).toEqual({
      eventName: 'SMART_SUGGESTION_AI_FIX',
      status: 'delegate-ai-fix',
      nextMode: null,
      effects: [],
    });
  });

  it('Scheme 面板在 SOURCE 为空时跳过并保留错误文案', () => {
    expect(buildAppSmartSuggestionActionPlan({
      actionId: 'scheme-panel',
      currentMode: TransformMode.NONE,
      sourceText: '   ',
    })).toMatchObject({
      status: 'skipped',
      errorMessage: 'SOURCE 为空，暂无可解析内容',
      effects: [],
    });
  });

  it('Scheme 面板会携带裁剪后的 SOURCE 并关闭深度报告', () => {
    expect(buildAppSmartSuggestionActionPlan({
      actionId: 'scheme-panel',
      currentMode: TransformMode.NONE,
      sourceText: '  sampleapp://v1/open  ',
    })).toMatchObject({
      status: 'success',
      schemeInputValue: 'sampleapp://v1/open',
      effects: ['open-scheme-panel', 'close-transform-report'],
      successMessage: '已填入 Scheme 解析',
    });
  });

  it('结构导航会切到嵌套解析并打开结构面板', () => {
    expect(buildAppSmartSuggestionActionPlan({
      actionId: 'structure-nav',
      currentMode: TransformMode.FORMAT,
      sourceText: '{"a":1}',
    })).toMatchObject({
      nextMode: TransformMode.DEEP_FORMAT,
      effects: ['open-json-tree-panel'],
      successMessage: '已打开结构导航',
    });
  });

  it('纯模式切换动作只返回目标模式和提示文案', () => {
    expect(buildAppSmartSuggestionActionPlan({
      actionId: 'json-to-typescript',
      currentMode: TransformMode.NONE,
      sourceText: '{"a":1}',
    })).toMatchObject({
      nextMode: TransformMode.JSON_TO_TYPESCRIPT,
      effects: [],
      successMessage: '已切换到 JSON 转 TS',
    });
    expect(buildAppSmartSuggestionActionPlan({
      actionId: 'url-decode',
      currentMode: TransformMode.URL_DECODE,
      sourceText: 'a%3D1',
    })).toMatchObject({
      nextMode: null,
      successMessage: '已切换到 URL 解码',
    });
  });
});
