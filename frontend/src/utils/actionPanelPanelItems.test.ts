import { describe, expect, it } from 'vitest';
import { ACTION_PANEL_PANEL_GROUP } from './actionPanelPanelItems';

describe('actionPanelPanelItems', () => {
  it('保持查询解析入口顺序和标题', () => {
    expect(ACTION_PANEL_PANEL_GROUP.title).toBe('查询 / 解析');
    expect(ACTION_PANEL_PANEL_GROUP.items.map(item => item.id)).toEqual([
      'jsonPath',
      'jsonCompare',
      'jsonTree',
      'jsonSchema',
      'scheme',
      'template',
    ]);
  });

  it('保留面板入口文案、图标和引导锚点', () => {
    expect(ACTION_PANEL_PANEL_GROUP.items).toEqual([
      expect.objectContaining({
        label: 'JSONPath 查询',
        iconId: 'search',
        dataTour: 'jsonpath-button',
      }),
      expect.objectContaining({
        label: 'JSON 对比',
        iconId: 'compare',
        dataTour: 'json-compare-button',
      }),
      expect.objectContaining({
        label: '结构导航',
        iconId: 'structure',
        dataTour: 'structure-nav-button',
      }),
      expect.objectContaining({
        label: 'Schema 校验',
        iconId: 'schema',
        dataTour: 'json-schema-button',
      }),
      expect.objectContaining({
        label: 'Scheme 解析',
        iconId: 'link',
        dataTour: 'scheme-button',
      }),
      expect.objectContaining({
        label: '模板填充',
        iconId: 'template',
        dataTour: 'template-fill-button',
      }),
    ]);
  });
});
