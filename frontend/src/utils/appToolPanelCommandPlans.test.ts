import { describe, expect, it } from 'vitest';
import {
  buildChangelogOpenState,
  buildJsonPathQueryRequest,
  buildJsonTreeFocusRequest,
  buildSchemeInputRequest,
  buildTemplateFillRequest,
  getPanelToggleEventName,
  getStandaloneSourceSchemeValue,
} from './appToolPanelCommandPlans';

describe('appToolPanelCommandPlans', () => {
  it('按打开状态选择面板埋点事件名', () => {
    expect(getPanelToggleEventName(true, 'OPEN', 'CLOSE')).toBe('OPEN');
    expect(getPanelToggleEventName(false, 'OPEN', 'CLOSE')).toBe('CLOSE');
  });

  it('构造 JSONPath 查询请求并忽略空查询', () => {
    expect(buildJsonPathQueryRequest(4, ' $.data[0] ')).toEqual({
      nextId: 5,
      request: { id: 5, query: '$.data[0]' },
    });
    expect(buildJsonPathQueryRequest(4, '   ')).toBeNull();
  });

  it('构造结构树定位和 Scheme 输入请求', () => {
    expect(buildJsonTreeFocusRequest(2, {
      path: '$.data[0].url',
      pointer: '/data/0/url',
      range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 8 },
      value: 'https://example.com',
    })).toEqual({
      nextId: 3,
      request: { id: 3, path: '$.data[0].url', pointer: '/data/0/url' },
    });
    expect(buildSchemeInputRequest(7, 'sampleapp://v1/open')).toEqual({
      nextId: 8,
      request: { id: 8, value: 'sampleapp://v1/open' },
    });
  });

  it('只允许 SOURCE 中可独立解析的输入打开 Scheme 面板', () => {
    expect(getStandaloneSourceSchemeValue(' sampleapp://v1/open ')).toBe('sampleapp://v1/open');
    expect(getStandaloneSourceSchemeValue('plain text')).toBe('');
  });

  it('归一化 changelog 打开状态', () => {
    expect(buildChangelogOpenState({
      version: '1.8.254',
      changelogMarkdown: '  ## 更新  ',
    })).toEqual({
      highlightedVersion: '1.8.254',
      sourceMarkdown: '  ## 更新  ',
    });
    expect(buildChangelogOpenState({ changelogMarkdown: '   ' })).toEqual({
      highlightedVersion: null,
      sourceMarkdown: null,
    });
  });

  it('构造模板填充请求并忽略空模板', () => {
    expect(buildTemplateFillRequest(9, '{{url}}')).toEqual({
      nextId: 10,
      request: { id: 10, template: '{{url}}' },
    });
    expect(buildTemplateFillRequest(9, '')).toBeNull();
  });
});
