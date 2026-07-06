import { describe, expect, it, vi } from 'vitest';
import { clickElement, findByType } from './componentElementTestHelpers';
import {
  buildJsonPathPanelResultToolbarActionItems,
  JsonPathPanelResultToolbarActionList,
} from './JsonPathPanelResultToolbarActionList';
import { JsonPathPanelResultToolbarButton } from './JsonPathPanelResultToolbarButton';

const buildActionListProps = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultToolbarActionList>[0]> = {}
) => ({
  isQuerying: false,
  canCopyValues: true,
  canCopyPathValues: true,
  copyButtonLabel: '复制值',
  copyPathValueButtonLabel: '复制路径和值',
  onCopyValues: vi.fn(),
  onCopyPathValues: vi.fn(),
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  ...overrides,
});

const renderActionList = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultToolbarActionList>[0]> = {}
) => JsonPathPanelResultToolbarActionList(buildActionListProps(overrides));

describe('JsonPathPanelResultToolbarActionList', () => {
  it('按固定顺序生成工具按钮配置和禁用态', () => {
    const actions = buildJsonPathPanelResultToolbarActionItems(buildActionListProps({
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
    const actions = buildJsonPathPanelResultToolbarActionItems(buildActionListProps({
      isQuerying: true,
    }));

    expect(actions.map(action => action.disabled)).toEqual([true, true, true, true]);
  });

  it('渲染按钮图标并接通点击回调', () => {
    const onCopyValues = vi.fn();
    const onCopyPathValues = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const tree = renderActionList({
      onCopyValues,
      onCopyPathValues,
      onPrevious,
      onNext,
    });
    const buttons = findByType(tree, JsonPathPanelResultToolbarButton);

    expect(buttons.map(button => button.props.label)).toEqual([
      '复制值',
      '复制路径和值',
      '上一个结果 (Shift+Enter)',
      '下一个结果 (Enter)',
    ]);
    expect(buttons[1].props.dataTour).toBe('jsonpath-copy-path-values');
    expect(findByType(tree, 'svg').map(icon => icon.props.viewBox)).toEqual([
      '0 0 24 24',
      '0 0 24 24',
      '0 0 24 24',
      '0 0 24 24',
    ]);

    buttons.forEach(clickElement);
    expect(onCopyValues).toHaveBeenCalledTimes(1);
    expect(onCopyPathValues).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
