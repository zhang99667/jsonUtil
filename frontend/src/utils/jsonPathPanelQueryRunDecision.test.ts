import { describe, expect, it } from 'vitest';
import { buildJsonPathPanelQueryRunDecision } from './jsonPathPanelQueryRunDecision';

const buildDecision = (overrides: Partial<Parameters<typeof buildJsonPathPanelQueryRunDecision>[0]> = {}) => (
  buildJsonPathPanelQueryRunDecision({
    queryInput: '$.name',
    jsonData: '{"name":"Ada"}',
    isDataPreparing: false,
    ...overrides,
  })
);

describe('jsonPathPanelQueryRunDecision', () => {
  it('返回可执行查询路径', () => {
    expect(buildDecision()).toEqual({
      queryPath: '$.name',
      syncQueryPath: null,
      skip: null,
    });
  });

  it('字段名快捷输入归一化后同步到输入框', () => {
    expect(buildDecision({ queryInput: 'traceId' })).toEqual({
      queryPath: '$..traceId',
      syncQueryPath: '$..traceId',
      skip: null,
    });
  });

  it.each([
    ['标准 JSONPath', '$.users[*].name'],
    ['URL 文本', 'https://example.com'],
  ])('%s 不作为字段名快捷输入回写', (_, queryInput) => {
    expect(buildDecision({ queryInput })).toEqual({
      queryPath: queryInput,
      syncQueryPath: null,
      skip: null,
    });
  });

  it('数字字段名快捷输入使用 bracket 查询并同步', () => {
    expect(buildDecision({ queryInput: '2024' })).toEqual({
      queryPath: '$..["2024"]',
      syncQueryPath: '$..["2024"]',
      skip: null,
    });
  });

  it('空 JSON 时仍同步字段名快捷输入再跳过查询', () => {
    expect(buildDecision({ queryInput: 'traceId', jsonData: '  ' })).toEqual({
      queryPath: '$..traceId',
      syncQueryPath: '$..traceId',
      skip: { error: '请先在左侧输入 JSON 数据' },
    });
  });

  it('数据准备中优先跳过且不回写快捷输入', () => {
    expect(buildDecision({ queryInput: 'traceId', isDataPreparing: true })).toEqual({
      queryPath: '$..traceId',
      syncQueryPath: null,
      skip: { error: '深度格式化仍在处理，请稍后查询' },
    });
  });

  it('空查询时跳过并要求清空结果和高亮', () => {
    expect(buildDecision({ queryInput: '  ', jsonData: '  ' })).toEqual({
      queryPath: '',
      syncQueryPath: null,
      skip: {
        error: '请输入 JSONPath 表达式或字段名',
        clearResults: true,
        clearHighlight: true,
      },
    });
  });
});
