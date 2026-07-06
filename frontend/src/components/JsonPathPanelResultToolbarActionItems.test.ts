import { describe, expect, it } from 'vitest';
import { buildJsonPathPanelResultToolbarActionItems } from './JsonPathPanelResultToolbarActionItems';
import { buildJsonPathPanelResultToolbarActionListProps } from './JsonPathPanelResultToolbarTestFixture';

describe('JsonPathPanelResultToolbarActionItems', () => {
  it('按固定顺序生成工具按钮配置和禁用态', () => {
    const actions = buildJsonPathPanelResultToolbarActionItems(buildJsonPathPanelResultToolbarActionListProps({
      canCopyValues: false,
    }));

    expect(actions.map(({ key, label, icon, dataTour, disabled }) => ({
      key,
      label,
      icon,
      dataTour,
      disabled,
    }))).toEqual([
      { key: 'copy-values', label: '复制值', icon: 'copyValues', dataTour: undefined, disabled: true },
      { key: 'copy-path-values', label: '复制路径和值', icon: 'copyPathValues', dataTour: 'jsonpath-copy-path-values', disabled: false },
      { key: 'previous', label: '上一个结果 (Shift+Enter)', icon: 'previous', dataTour: undefined, disabled: false },
      { key: 'next', label: '下一个结果 (Enter)', icon: 'next', dataTour: undefined, disabled: false },
    ]);
  });

  it('查询中禁用所有工具按钮', () => {
    const actions = buildJsonPathPanelResultToolbarActionItems(buildJsonPathPanelResultToolbarActionListProps({
      isQuerying: true,
    }));

    expect(actions.map(action => action.disabled)).toEqual([true, true, true, true]);
  });
});
