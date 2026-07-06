import { describe, expect, it, vi } from 'vitest';
import { clickElement, findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultToolbarButton } from './JsonPathPanelResultToolbarButton';
import { JsonPathPanelResultToolbarIcon } from './JsonPathPanelResultToolbarIcon';
import { renderJsonPathPanelResultToolbarActionList } from './JsonPathPanelResultToolbarTestFixture';

describe('JsonPathPanelResultToolbarActionList', () => {
  it('渲染按钮图标并接通点击回调', () => {
    const onCopyValues = vi.fn();
    const onCopyPathValues = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const tree = renderJsonPathPanelResultToolbarActionList({
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
    expect(findByType(tree, JsonPathPanelResultToolbarIcon).map(icon => icon.props.icon)).toEqual([
      'copyValues',
      'copyPathValues',
      'previous',
      'next',
    ]);

    buttons.forEach(clickElement);
    expect(onCopyValues).toHaveBeenCalledTimes(1);
    expect(onCopyPathValues).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
