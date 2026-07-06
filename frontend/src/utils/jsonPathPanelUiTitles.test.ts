import { describe, expect, it } from 'vitest';
import {
  getJsonPathPanelFavoriteToggleTitle,
  getJsonPathPanelInputDescriptionId,
  getJsonPathPanelQueryButtonTitle,
} from './jsonPathPanelUiTitles';

describe('jsonPathPanelUiTitles', () => {
  it('生成收藏按钮 title', () => {
    expect(getJsonPathPanelFavoriteToggleTitle('', false))
      .toBe('请输入 JSONPath 表达式或字段名后可收藏');
    expect(getJsonPathPanelFavoriteToggleTitle('$.items', true))
      .toBe('取消收藏当前查询');
    expect(getJsonPathPanelFavoriteToggleTitle('$.items', false))
      .toBe('收藏当前查询');
  });

  it('按查询前置状态生成查询按钮 title', () => {
    expect(getJsonPathPanelQueryButtonTitle({
      normalizedQuery: '$.items',
      isDataPreparing: true,
      isQuerying: false,
      hasJsonData: true,
    })).toBe('深度格式化仍在处理，请稍后查询');
    expect(getJsonPathPanelQueryButtonTitle({
      normalizedQuery: '$.items',
      isDataPreparing: false,
      isQuerying: true,
      hasJsonData: true,
    })).toBe('JSONPath 查询正在运行，可取消后重新查询');
    expect(getJsonPathPanelQueryButtonTitle({
      normalizedQuery: '',
      isDataPreparing: false,
      isQuerying: false,
      hasJsonData: true,
    })).toBe('请输入 JSONPath 表达式或字段名后查询');
    expect(getJsonPathPanelQueryButtonTitle({
      normalizedQuery: '$.items',
      isDataPreparing: false,
      isQuerying: false,
      hasJsonData: false,
    })).toBe('请先在 SOURCE 输入 JSON 数据');
  });

  it('为查询输入选择错误或结果状态描述', () => {
    const input = { totalResults: 0, navigableResultCount: 0, errorMessageId: 'jsonpath-error', resultStatusId: 'jsonpath-status' };

    expect(getJsonPathPanelInputDescriptionId({ ...input, error: 'bad' })).toBe('jsonpath-error');
    expect(getJsonPathPanelInputDescriptionId({ ...input, error: '', totalResults: 2, navigableResultCount: 2 }))
      .toBe('jsonpath-status');
    expect(getJsonPathPanelInputDescriptionId({ ...input, error: '' })).toBeUndefined();
  });
});
