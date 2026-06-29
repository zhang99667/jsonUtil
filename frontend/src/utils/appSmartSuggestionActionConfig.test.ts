import { describe, expect, it } from 'vitest';
import { getAppSmartSuggestionStaticResult } from './appSmartSuggestionActionConfig';

describe('appSmartSuggestionActionConfig', () => {
  it('返回深度解析报告和结构面板动作的静态结果', () => {
    expect(getAppSmartSuggestionStaticResult('deep-format-report')).toEqual({
      effects: ['close-transform-report'],
      successMessage: '已切换到嵌套解析，可手动查看报告',
    });
    expect(getAppSmartSuggestionStaticResult('structure-nav')).toEqual({
      effects: ['open-json-tree-panel'],
      successMessage: '已打开结构导航',
    });
  });

  it('纯模式切换动作只返回成功文案', () => {
    expect(getAppSmartSuggestionStaticResult('json-to-typescript')).toEqual({
      effects: [],
      successMessage: '已切换到 JSON 转 TS',
    });
    expect(getAppSmartSuggestionStaticResult('url-decode')).toEqual({
      effects: [],
      successMessage: '已切换到 URL 解码',
    });
  });

  it('需要特殊处理的动作不返回静态结果', () => {
    expect(getAppSmartSuggestionStaticResult('ai-fix')).toBeNull();
    expect(getAppSmartSuggestionStaticResult('scheme-panel')).toBeNull();
  });
});
